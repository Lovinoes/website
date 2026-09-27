import { readFile } from 'node:fs/promises';
import { insertRows, queryRows } from '../worker/clickhouse.ts';
import { COMMITTED_REPUTATION, MAX_OBSERVATIONS, replayIdentity, reviewTelemetry } from '../worker/telemetry-review.ts';

const [command, uuid, submissionId, ...reasonParts] = process.argv.slice(2);
const commands = ['prune', 'status', 'quarantined', 'observations', 'quarantine', 'approve', 'reset', 'review'];
if (!commands.includes(command)) {
  console.error(
    'Usage: node --env-file=.dev.vars scripts/telemetry.mjs prune | status|quarantined [uuid] | observations uuid | review [uuid] | quarantine|approve|reset uuid submission_id reason',
  );
  process.exit(2);
}
const guid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
if ((uuid && !guid.test(uuid)) || (submissionId && !guid.test(submissionId))) throw new Error('Invalid UUID');
const { vars } = JSON.parse(await readFile(new URL('../wrangler.json', import.meta.url), 'utf8'));
const config = {
  url: process.env.CLICKHOUSE_URL,
  user: process.env.CLICKHOUSE_USER,
  password: process.env.CLICKHOUSE_PASSWORD,
  database: process.env.CLICKHOUSE_DATABASE || vars.CLICKHOUSE_DATABASE,
};
if (!config.url || !config.user || !config.password) throw new Error('ClickHouse connection variables are required');

if (command === 'prune') {
  for (const table of ['telemetry_decisions', 'telemetry_accepted_history']) {
    const endpoint = new URL(config.url);
    endpoint.searchParams.set('database', config.database);
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'X-ClickHouse-User': config.user, 'X-ClickHouse-Key': config.password },
      body: `DELETE FROM ${table} WHERE generated_at < now() - INTERVAL 7 DAY AND (uuid, generation) NOT IN (SELECT uuid, generation FROM (${COMMITTED_REPUTATION}))`,
      signal: AbortSignal.timeout(60_000),
    });
    if (!response.ok) throw new Error(`Generation cleanup failed: HTTP ${response.status}`);
    await response.text();
  }
  console.log(
    'Removed obsolete derived generations older than seven days; observations, moderation and current generations retained.',
  );
} else if (command === 'status' || command === 'quarantined') {
  const filter = `WHERE 1 ${uuid ? 'AND d.uuid = {uuid:UUID}' : ''} ${command === 'quarantined' ? 'AND d.accepted = 0' : ''}`;
  const held = await queryRows(
    config,
    `SELECT uuid, count() AS observations, 'replay_limit' AS reason FROM telemetry_observations WHERE received_at >= now() - INTERVAL 2 YEAR ${uuid ? 'AND uuid = {uuid:UUID}' : ''} GROUP BY uuid HAVING observations > ${MAX_OBSERVATIONS} LIMIT 100`,
    uuid ? { uuid } : {},
  );
  const rows = await queryRows(
    config,
    `
    SELECT d.uuid, d.submission_id, d.received_at, d.accepted, d.eligible, d.reason, r.tier, r.accepted_days
    FROM telemetry_decisions d
    INNER JOIN (${COMMITTED_REPUTATION}) r ON d.uuid = r.uuid AND d.generation = r.generation
    ${filter}
    ORDER BY d.received_at DESC, d.submission_id DESC LIMIT 100
  `,
    uuid ? { uuid } : {},
  );
  console.log(JSON.stringify({ held, decisions: rows }, null, 2));
} else if (command === 'observations') {
  if (!uuid) throw new Error('UUID required');
  const rows = await queryRows(
    config,
    'SELECT submission_id, received_at, users_total, servers_total, backups_total, node_count FROM telemetry_observations WHERE uuid = {uuid:UUID} ORDER BY received_at DESC, submission_id DESC LIMIT 100',
    { uuid },
  );
  console.log(JSON.stringify(rows, null, 2));
} else if (command === 'review') {
  if (uuid) {
    if (!(await replayIdentity(config, uuid))) throw new Error('Input changed during review; retry');
  } else await reviewTelemetry(config);
  console.log('Telemetry review completed; public snapshots refresh on the next hourly run.');
} else {
  const reason = reasonParts.join(' ').trim();
  if (!uuid || !submissionId || !reason || reason.length > 1024)
    throw new Error('UUID, submission ID and reason (1-1024 characters) required');
  const [row] = await queryRows(
    config,
    `
    SELECT count() AS count FROM telemetry_observations
    WHERE uuid = {uuid:UUID} AND submission_id = {submission:UUID}
  `,
    { uuid, submission: submissionId },
  );
  if (!Number(row.count)) throw new Error('Observation not found');
  await insertRows(
    config,
    'telemetry_moderation',
    [
      {
        uuid,
        submission_id: submissionId,
        event_id: crypto.randomUUID(),
        recorded_at: Date.now(),
        action: command,
        reason,
      },
    ],
    true,
  );
  if (!(await replayIdentity(config, uuid)))
    throw new Error('Moderation saved; input changed during replay, retry review');
  console.log('Moderation saved and history rebuilt; public snapshots refresh on the next hourly run.');
}
