import assert from 'node:assert/strict';
import { classifyObservations } from '../worker/telemetry-policy.ts';

const DAY = 86400;
const HOUR = 3600;
const T0 = Date.UTC(2026, 0, 1) / 1000;
const UUID = '00000000-0000-4000-8000-000000000001';
const SMALL = { users_total: 10, servers_total: 5 };
const BIG = { users_total: 10_000, servers_total: 5 };
let seq = 0;

function obs(day, hour, metrics = {}, extra = {}) {
  return {
    uuid: UUID,
    submission_id: `sub-${++seq}`,
    received_at: T0 + day * DAY + hour * HOUR,
    valid: 1,
    action: '',
    users_total: 0,
    servers_total: 0,
    backups_total: 0,
    node_count: 0,
    database_agent_host_count: 0,
    node_memory_bytes: 0,
    servers_online: 0,
    ...metrics,
    ...extra,
  };
}
function reasons(observations) {
  return classifyObservations(observations).decisions.map((d) => d.reason);
}
function days(from, to, metrics, hour = 12) {
  return Array.from({ length: to - from }, (_, i) => obs(from + i, hour, metrics));
}
const baseline = () => days(0, 5, SMALL);
const BASELINE_REASONS = ['probation', 'probation', 'accepted', 'accepted', 'accepted'];

// classifyObservations
{
  const result = classifyObservations([...baseline(), ...days(5, 45, BIG)]);
  const r = result.decisions.map((d) => d.reason);
  assert.deepEqual(r.slice(0, 10), [
    ...BASELINE_REASONS,
    'growth:users_total',
    'growth:users_total',
    'rebaseline',
    'accepted',
    'accepted',
  ]);
  assert.deepEqual(new Set(r.slice(8)), new Set(['accepted']));
  assert.equal(result.decisions[7].accepted, 1);
  assert.equal(result.decisions[7].eligible, 1);
  assert.equal(result.history.at(-1).users_total, 10_000);
}
{
  const r = reasons([...baseline(), obs(5, 23, BIG), obs(6, 12, BIG), obs(7, 1, BIG), obs(8, 0, BIG)]);
  assert.deepEqual(r.slice(5), ['growth:users_total', 'growth:users_total', 'growth:users_total', 'rebaseline']);
}
{
  const input = [];
  for (let d = 0; d < 20; d++) {
    const small = obs(d, d % 2 ? 18 : 6, SMALL);
    const big = obs(d, d % 2 ? 6 : 18, BIG);
    input.push(...(d % 2 ? [big, small] : [small, big]));
  }
  const { decisions } = classifyObservations(input);
  for (const [i, d] of decisions.entries()) {
    assert.equal(d.accepted, input[i].users_total === 10 ? 1 : 0, `${i} ${d.reason}`);
  }
}
{
  const inflated = { users_total: 10, servers_total: 5_000 };
  const input = baseline();
  for (let d = 5; d < 25; d++) input.push(obs(d, 6, inflated), obs(d, 12, SMALL), obs(d, 20, inflated));
  const { decisions } = classifyObservations(input);
  for (const [i, d] of decisions.entries()) {
    if (input[i].servers_total === 5_000) assert.equal(d.reason, 'growth:servers_total', `${i}`);
    else assert.equal(d.accepted, 1, `${i} ${d.reason}`);
  }
}
{
  const r = reasons([...days(0, 3, SMALL), ...days(3, 10, { users_total: 30_500_001 })]);
  assert.deepEqual(r.slice(3), Array(7).fill('limit:users_total'));
}
{
  const r = reasons([
    ...baseline(),
    obs(5, 12, BIG),
    obs(6, 12, BIG),
    obs(7, 12, BIG, { action: 'quarantine' }),
    ...days(8, 11, BIG),
  ]);
  assert.deepEqual(r.slice(5), [
    'growth:users_total',
    'growth:users_total',
    'manual_quarantine',
    'growth:users_total',
    'growth:users_total',
    'rebaseline',
  ]);
  const approved = classifyObservations([...baseline(), obs(5, 12, BIG, { action: 'approve' })]).decisions[5];
  assert.equal(approved.reason, 'manual_approval');
  assert.equal(approved.accepted, 1);
}
{
  const r = reasons([...baseline(), obs(5, 12, BIG), ...days(6, 40, SMALL)]);
  assert.deepEqual(r.slice(0, 6), [...BASELINE_REASONS, 'growth:users_total']);
  assert.deepEqual(r.slice(6), Array(34).fill('accepted'));
}

console.log('telemetry policy checks passed');
