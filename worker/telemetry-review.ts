import { type ClickHouseConfig, insertRows, queryRows } from './clickhouse.ts';
import { classifyObservations, METRICS, type Observation, POLICY_VERSION } from './telemetry-policy.ts';

export const MAX_OBSERVATIONS = 20_000;
const REPLAY_BATCH = 100;
const WRITE_BATCH = 1_000;

export const MODERATION_REVISIONS = `
  SELECT uuid, toString(max(tuple(recorded_at, event_id))) AS moderation_revision
  FROM telemetry_moderation GROUP BY uuid
`;

export const COMMITTED_REPUTATION = `
  SELECT * FROM telemetry_reputation
  ORDER BY started_at DESC, generation DESC LIMIT 1 BY uuid
`;

export const ELIGIBLE_GENERATIONS = `
  SELECT r.uuid AS uuid, r.generation AS generation
  FROM (${COMMITTED_REPUTATION}) r
  LEFT JOIN (${MODERATION_REVISIONS}) m ON r.uuid = m.uuid
  WHERE r.policy_version = ${POLICY_VERSION}
    AND r.moderation_revision = ifNull(m.moderation_revision, '')
`;

const SOURCES = `
  SELECT uuid, count() AS source_count,
    toString(sum(cityHash64(submission_id, received_at))) AS source_fingerprint
  FROM telemetry_observations
  WHERE received_at >= now() - INTERVAL 2 YEAR
  GROUP BY uuid
`;

export const DIRTY_IDENTITIES = `
  SELECT uuid FROM (
    SELECT s.uuid AS uuid, ifNull(r.policy_version, 0) > 0 AS known,
      row_number() OVER (PARTITION BY known ORDER BY r.started_at, rand()) AS position
    FROM (${SOURCES}) s
    LEFT JOIN (${COMMITTED_REPUTATION}) r ON s.uuid = r.uuid
    LEFT JOIN (${MODERATION_REVISIONS}) m ON s.uuid = m.uuid
    WHERE s.source_count <= ${MAX_OBSERVATIONS}
      AND (ifNull(r.policy_version, 0) != ${POLICY_VERSION}
        OR s.source_count != r.source_count
        OR s.source_fingerprint != r.source_fingerprint
        OR ifNull(m.moderation_revision, '') != r.moderation_revision)
  )
  ORDER BY if(position <= if(known, 75, 25), 0, 1), position, uuid
  LIMIT ${REPLAY_BATCH}
`;

export const SOURCE_STATE = `
  SELECT source_count, source_fingerprint,
    (SELECT toString(max(tuple(recorded_at, event_id))) FROM telemetry_moderation
      WHERE uuid = {uuid:UUID} HAVING count() > 0) AS moderation_revision
  FROM (
    SELECT count() AS source_count,
      toString(sum(cityHash64(submission_id, received_at))) AS source_fingerprint
    FROM telemetry_observations
    WHERE uuid = {uuid:UUID} AND received_at >= now() - INTERVAL 2 YEAR
  )
`;

export const OBSERVATIONS_QUERY = `
  SELECT o.uuid AS uuid, o.submission_id AS submission_id,
    toUnixTimestamp(o.received_at) AS received_at,
    o.users_total, o.servers_total, o.backups_total, o.node_count, o.database_agent_host_count,
    arraySum(o.\`nodes.memory_total_bytes\`) AS node_memory_bytes,
    arraySum(o.\`nodes.servers_online\`) AS servers_online,
    toUInt8(o.panel_version != ''
      AND arraySum(mapValues(o.users_languages)) = o.users_total
      AND arraySum(mapValues(o.backups_disks)) = o.backups_total
      AND arrayAll((total, online, offline) -> online + offline = total,
        o.\`nodes.servers_total\`, o.\`nodes.servers_online\`, o.\`nodes.servers_offline\`)
      AND arrayAll((total, online, offline) -> online + offline = total,
        o.\`database_agent_hosts.instances_total\`, o.\`database_agent_hosts.instances_online\`, o.\`database_agent_hosts.instances_offline\`)
    ) AS valid,
    ifNull(m.action, '') AS action
  FROM telemetry_observations o
  LEFT JOIN (
    SELECT submission_id, argMax(toString(action), tuple(recorded_at, event_id)) AS action
    FROM telemetry_moderation WHERE uuid = {uuid:UUID} GROUP BY submission_id
  ) m ON o.submission_id = m.submission_id
  WHERE o.uuid = {uuid:UUID} AND o.received_at >= now() - INTERVAL 2 YEAR
  ORDER BY o.received_at, o.submission_id
  LIMIT ${MAX_OBSERVATIONS + 1}
`;

interface SourceState {
  source_count: number;
  source_fingerprint: string;
  moderation_revision: string | null;
}

async function writeBatches(config: ClickHouseConfig, table: string, rows: Record<string, unknown>[]): Promise<void> {
  for (let offset = 0; offset < rows.length; offset += WRITE_BATCH) {
    await insertRows(config, table, rows.slice(offset, offset + WRITE_BATCH), true);
  }
}

export async function replayIdentity(config: ClickHouseConfig, uuid: string): Promise<boolean> {
  const startedAt = Date.now();
  const generation = crypto.randomUUID();
  const [source] = await queryRows<SourceState>(config, SOURCE_STATE, { uuid });
  const observations = await queryRows<Observation>(config, OBSERVATIONS_QUERY, { uuid });
  if (observations.length > MAX_OBSERVATIONS) throw new Error('telemetry identity exceeds replay limit');
  if (observations.length !== Number(source.source_count)) return false;

  const { decisions, history, reputation } = classifyObservations(observations);
  await writeBatches(
    config,
    'telemetry_decisions',
    decisions.map((decision) => ({ ...decision, generation })),
  );
  await writeBatches(
    config,
    'telemetry_accepted_history',
    history.map((observation) => ({
      uuid,
      generation,
      submission_id: observation.submission_id,
      received_at: observation.received_at,
      ...Object.fromEntries(METRICS.map((metric) => [metric, observation[metric]])),
    })),
  );

  const [current] = await queryRows<SourceState>(config, SOURCE_STATE, { uuid });
  if (JSON.stringify(source) !== JSON.stringify(current)) return false;
  await insertRows(
    config,
    'telemetry_reputation',
    [
      {
        uuid,
        generation,
        started_at: startedAt,
        policy_version: POLICY_VERSION,
        ...source,
        moderation_revision: source.moderation_revision ?? '',
        ...reputation,
      },
    ],
    true,
  );
  return true;
}

export async function reviewTelemetry(config: ClickHouseConfig): Promise<void> {
  const identities = await queryRows<{ uuid: string }>(config, DIRTY_IDENTITIES);
  for (let offset = 0; offset < identities.length; offset += 4) {
    const outcomes = await Promise.allSettled(
      identities.slice(offset, offset + 4).map(({ uuid }) => replayIdentity(config, uuid)),
    );
    for (const outcome of outcomes) {
      if (outcome.status === 'rejected') console.error('telemetry review failed', outcome.reason);
    }
  }
}
