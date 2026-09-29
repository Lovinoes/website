import { type ClickHouseConfig, clickhouseConfig, queryRows } from '../clickhouse.ts';
import { json, preflight } from '../http.ts';
import { ELIGIBLE_GENERATIONS, reviewTelemetry } from '../telemetry-review.ts';

const SNAPSHOT_KEY = 'telemetry::accepted-snapshot:v1';
const MAX_SNAPSHOT_AGE_MS = 2 * 60 * 60 * 1_000;

const WINDOW_HOURS = 48;
const HISTORY_DAYS = 730;

const MIN_INSTANCES = 50;

const RANGES: Record<string, number> = { '30d': 30, '90d': 90, '1y': 365, all: HISTORY_DAYS };
const DEFAULT_RANGE = '90d';

export interface DayPoint {
  day: string;
  instances: number;
  servers: number;
  users: number;
  backups: number;
  nodes: number;
}

export interface TelemetrySnapshot {
  status: 'ok' | 'insufficient_data';
  generated_at: string;
  window_hours: number;
  instances: number;
  totals: Record<string, number>;
  daily: DayPoint[];
}

const LATEST_PER_INSTANCE = `
  SELECT
    argMax(users_total, tuple(received_at, submission_id)) AS users_total,
    argMax(servers_total, tuple(received_at, submission_id)) AS servers_total,
    argMax(backups_total, tuple(received_at, submission_id)) AS backups_total,
    argMax(node_count, tuple(received_at, submission_id)) AS node_count,
    argMax(database_agent_host_count, tuple(received_at, submission_id)) AS database_agent_host_count,
    argMax(node_memory_bytes, tuple(received_at, submission_id)) AS node_memory_bytes,
    argMax(servers_online, tuple(received_at, submission_id)) AS servers_online
  FROM telemetry_accepted_history
  WHERE (uuid, generation) IN (${ELIGIBLE_GENERATIONS})
  AND day >= {from:Date} AND received_at >= now() - INTERVAL {hours:UInt32} HOUR
  GROUP BY uuid
`;

export const TOTALS_QUERY = `
  SELECT
    count() AS instances,
    sum(servers_total) AS servers,
    sum(users_total) AS users,
    sum(backups_total) AS backups,
    sum(node_count) AS nodes,
    sum(database_agent_host_count) AS database_agent_hosts,
    sum(node_memory_bytes) AS node_memory_bytes,
    sum(servers_online) AS servers_online
  FROM (${LATEST_PER_INSTANCE})
`;

export const DAILY_QUERY = `
  SELECT
    toString(target) AS day,
    count() AS instances,
    sum(servers_total) AS servers,
    sum(users_total) AS users,
    sum(backups_total) AS backups,
    sum(node_count) AS nodes
  FROM (
    SELECT
      target,
      argMax(servers_total, tuple(received_at, submission_id)) AS servers_total,
      argMax(users_total, tuple(received_at, submission_id)) AS users_total,
      argMax(backups_total, tuple(received_at, submission_id)) AS backups_total,
      argMax(node_count, tuple(received_at, submission_id)) AS node_count
    FROM (
      SELECT uuid, arrayJoin([day, day + 1]) AS target, received_at, submission_id,
        servers_total, users_total, backups_total, node_count
      FROM telemetry_accepted_history
      WHERE (uuid, generation) IN (${ELIGIBLE_GENERATIONS})
        AND day >= {from:Date}
    )
    GROUP BY target, uuid
  )
  GROUP BY target
  ORDER BY target
`;

function roundCount(value: number): number {
  if (value < 1_000) return Math.round(value / 10) * 10;
  if (value < 100_000) return Math.round(value / 100) * 100;
  return Math.round(value / 1_000) * 1_000;
}

function isoDaysAgo(days: number): string {
  return new Date(Date.now() - days * 86_400_000).toISOString().slice(0, 10);
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function insufficient(): TelemetrySnapshot {
  return {
    status: 'insufficient_data',
    generated_at: new Date().toISOString(),
    window_hours: WINDOW_HOURS,
    instances: 0,
    totals: {},
    daily: [],
  };
}

async function buildSnapshot(config: ClickHouseConfig): Promise<TelemetrySnapshot> {
  const from = isoDaysAgo(Math.ceil(WINDOW_HOURS / 24));

  const [totals] = await queryRows<Record<string, number>>(config, TOTALS_QUERY, { from, hours: WINDOW_HOURS });
  const instances = Number(totals?.instances ?? 0);
  if (instances < MIN_INSTANCES) return insufficient();

  const dailyRows = await queryRows<DayPoint>(config, DAILY_QUERY, { from: isoDaysAgo(HISTORY_DAYS) });
  const current = today();
  const daily: DayPoint[] = [];

  for (const row of dailyRows) {
    if (row.day >= current) continue;
    if (Number(row.instances) < MIN_INSTANCES) continue;

    daily.push({
      day: row.day,
      instances: roundCount(Number(row.instances)),
      servers: roundCount(Number(row.servers)),
      users: roundCount(Number(row.users)),
      backups: roundCount(Number(row.backups)),
      nodes: roundCount(Number(row.nodes)),
    });
  }

  return {
    status: 'ok',
    generated_at: new Date().toISOString(),
    window_hours: WINDOW_HOURS,
    instances: roundCount(instances),
    totals: {
      servers: roundCount(Number(totals.servers)),
      servers_online: roundCount(Number(totals.servers_online)),
      users: roundCount(Number(totals.users)),
      backups: roundCount(Number(totals.backups)),
      nodes: roundCount(Number(totals.nodes)),
      database_agent_hosts: roundCount(Number(totals.database_agent_hosts)),
      node_memory_bytes: Number(totals.node_memory_bytes),
    },
    daily,
  };
}

export async function refreshTelemetryStats(env: Env): Promise<void> {
  const config = clickhouseConfig(env);
  if (config === null) return;

  await reviewTelemetry(config);
  const snapshot = await buildSnapshot(config);
  await env.VERSION_CACHE.put(SNAPSHOT_KEY, JSON.stringify(snapshot));
}

async function snapshot(env: Env): Promise<TelemetrySnapshot | null> {
  const current = (await env.VERSION_CACHE.get(SNAPSHOT_KEY, 'json')) as TelemetrySnapshot | null;
  if (!current || !Number.isFinite(Date.parse(current.generated_at))) return null;
  if (Date.now() - Date.parse(current.generated_at) > MAX_SNAPSHOT_AGE_MS) return null;
  return current;
}

export async function handleTelemetryStats(request: Request, env: Env): Promise<Response> {
  if (request.method === 'OPTIONS') return preflight('GET, OPTIONS');
  if (request.method !== 'GET') return json({ error: 'Method Not Allowed' }, 405);

  const current = await snapshot(env);
  if (current === null) return json({ error: 'Telemetry statistics not yet available' }, 503);
  if (current.status !== 'ok') return json({ status: current.status, generated_at: current.generated_at });

  return json({
    status: current.status,
    generated_at: current.generated_at,
    window_hours: current.window_hours,
    instances: current.instances,
    totals: current.totals,
  });
}

export async function handleTelemetryHistory(request: Request, env: Env): Promise<Response> {
  if (request.method === 'OPTIONS') return preflight('GET, OPTIONS');
  if (request.method !== 'GET') return json({ error: 'Method Not Allowed' }, 405);

  const requested = new URL(request.url).searchParams.get('range') ?? DEFAULT_RANGE;
  const days = RANGES[requested];
  if (days === undefined) return json({ error: `Unknown range. Use one of ${Object.keys(RANGES).join(', ')}` }, 400);

  const current = await snapshot(env);
  if (current === null) return json({ error: 'Telemetry statistics not yet available' }, 503);
  if (current.status !== 'ok') return json({ status: current.status, generated_at: current.generated_at });

  const cutoff = isoDaysAgo(days);

  return json({
    status: current.status,
    generated_at: current.generated_at,
    range: requested,
    daily: current.daily.filter((point) => point.day >= cutoff),
  });
}
