export const POLICY_VERSION = 3;
export const SERVED_POLICY_VERSIONS = [POLICY_VERSION];

const DAY = 86_400;
const HOUR = 3_600;
const PROBATION_DAYS = 3;
const PROBATION_SECONDS = 2 * DAY - HOUR;
const ESTABLISHED_DAYS = 14;
const ESTABLISHED_SECONDS = 21 * DAY;
const INACTIVITY_SECONDS = 30 * DAY;
const BASELINE_SECONDS = 30 * DAY;
const MEMORY_PER_NODE = 4 * 1024 ** 4;
const USERS_FLOOR = 10_000;
const USERS_PER_SERVER = 250;

export const METRICS = [
  'users_total',
  'servers_total',
  'backups_total',
  'node_count',
  'database_agent_host_count',
  'node_memory_bytes',
  'servers_online',
] as const;

const GUARDED = ['users_total', 'servers_total', 'node_count', 'database_agent_host_count'] as const;
const STABLE = [...GUARDED, 'backups_total'] as const;

type Metric = (typeof METRICS)[number];
type StableMetric = (typeof STABLE)[number];
export type Metrics = Record<Metric, number>;
export type ReputationTier = 'new' | 'probation' | 'established';

const LIMITS: Metrics = {
  users_total: 1_000_000,
  servers_total: 100_000,
  backups_total: 1_000_000,
  node_count: 2_000,
  database_agent_host_count: 2_000,
  node_memory_bytes: 1024 ** 5,
  servers_online: 100_000,
};

const GROWTH_ALLOWANCE: Metrics = {
  users_total: 1_000,
  servers_total: 500,
  backups_total: 5_000,
  node_count: 20,
  database_agent_host_count: 20,
  node_memory_bytes: 1024 ** 4,
  servers_online: 500,
};

export interface Observation extends Metrics {
  uuid: string;
  submission_id: string;
  received_at: number;
  valid: number;
  action: '' | 'quarantine' | 'approve' | 'reset';
}

export interface Decision {
  uuid: string;
  submission_id: string;
  received_at: number;
  accepted: number;
  eligible: number;
  reason: string;
}

export interface Reputation {
  accepted_days: number;
  first_accepted_at: number;
  last_accepted_at: number;
  tier: ReputationTier;
}

interface PlateauDay {
  day: number;
  first: number;
  min: Record<StableMetric, number>;
  max: Record<StableMetric, number>;
}

function band(metric: Metric, value: number): number {
  return Math.max(value * 5, value + GROWTH_ALLOWANCE[metric]);
}

function shifted(observation: Observation, reference: Observation): string | undefined {
  const growth = STABLE.find((metric) => observation[metric] > band(metric, reference[metric]));
  if (growth) return `growth:${growth}`;
  const drop = GUARDED.find((metric) => reference[metric] > band(metric, observation[metric]));
  if (drop) return `drop:${drop}`;
}

function implausible(observation: Observation): string | undefined {
  if (observation.servers_online > observation.servers_total) return 'servers_online';
  if (observation.node_memory_bytes > observation.node_count * MEMORY_PER_NODE) return 'node_memory_bytes';
  if (observation.users_total > Math.max(USERS_FLOOR, USERS_PER_SERVER * observation.servers_total))
    return 'users_per_server';
}

function stableWith(bucket: PlateauDay, observation: Observation): boolean {
  return STABLE.every(
    (metric) =>
      observation[metric] <= band(metric, bucket.min[metric]) &&
      bucket.max[metric] <= band(metric, observation[metric]),
  );
}

function joinPlateau(plateau: PlateauDay[], observation: Observation, day: number): PlateauDay[] {
  const recent = plateau.filter((bucket) => observation.received_at - bucket.first <= BASELINE_SECONDS);
  let start = recent.length;
  while (start > 0 && stableWith(recent[start - 1], observation)) start--;
  const kept = recent.slice(start);
  const last = kept.at(-1);
  if (last?.day === day) {
    for (const metric of STABLE) {
      last.min[metric] = Math.min(last.min[metric], observation[metric]);
      last.max[metric] = Math.max(last.max[metric], observation[metric]);
    }
  } else {
    const values = Object.fromEntries(STABLE.map((metric) => [metric, observation[metric]])) as Record<
      StableMetric,
      number
    >;
    kept.push({ day, first: observation.received_at, min: { ...values }, max: { ...values } });
  }
  return kept;
}

export function classifyObservations(observations: Observation[]): {
  decisions: Decision[];
  history: Observation[];
  reputation: Reputation;
} {
  const decisions: Decision[] = [];
  const history = new Map<number, Observation>();
  let acceptedDays = new Set<number>();
  let firstAccepted = 0;
  let previous: Observation | undefined;
  let rolling: Observation[] = [];
  let plateau: PlateauDay[] = [];
  let tier: ReputationTier = 'new';

  for (const observation of observations) {
    const day = Math.floor(observation.received_at / DAY);
    const inactive = previous !== undefined && observation.received_at - previous.received_at >= INACTIVITY_SECONDS;
    let reason = '';
    let rebaseline = false;

    if (observation.action === 'quarantine') {
      reason = 'manual_quarantine';
      plateau = [];
    } else if (
      !observation.valid ||
      METRICS.some((metric) => !Number.isSafeInteger(observation[metric]) || observation[metric] < 0)
    )
      reason = 'invalid_observation';
    else {
      const extreme = METRICS.find((metric) => observation[metric] > LIMITS[metric]);
      const rule = implausible(observation);
      if (extreme) reason = `limit:${extreme}`;
      else if (rule) reason = `implausible:${rule}`;
      else if (observation.action !== 'approve' && previous && !inactive) {
        const baseline =
          rolling.find((entry) => observation.received_at - entry.received_at <= BASELINE_SECONDS) ?? previous;
        const shift = shifted(observation, previous) ?? shifted(observation, baseline);
        if (shift) {
          plateau = joinPlateau(plateau, observation, day);
          rebaseline =
            plateau.length >= PROBATION_DAYS && observation.received_at - plateau[0].first >= PROBATION_SECONDS;
          if (!rebaseline) reason = shift;
        }
      }
    }

    if (reason) {
      decisions.push({
        uuid: observation.uuid,
        submission_id: observation.submission_id,
        received_at: observation.received_at,
        accepted: 0,
        eligible: 0,
        reason,
      });
      continue;
    }

    if (inactive) {
      acceptedDays = new Set();
      rolling = [];
      firstAccepted = 0;
    }
    if (acceptedDays.size === 0) firstAccepted = observation.received_at;
    acceptedDays.add(day);
    const elapsed = observation.received_at - firstAccepted;
    const eligible = acceptedDays.size >= PROBATION_DAYS && elapsed >= PROBATION_SECONDS;
    tier = acceptedDays.size >= ESTABLISHED_DAYS && elapsed >= ESTABLISHED_SECONDS ? 'established' : 'probation';
    decisions.push({
      uuid: observation.uuid,
      submission_id: observation.submission_id,
      received_at: observation.received_at,
      accepted: 1,
      eligible: Number(eligible),
      reason:
        observation.action === 'approve'
          ? 'manual_approval'
          : rebaseline
            ? 'rebaseline'
            : eligible
              ? 'accepted'
              : 'probation',
    });
    if (eligible) history.set(day, observation);
    if (rebaseline) rolling = [];
    plateau = [];
    rolling = rolling.filter((entry) => observation.received_at - entry.received_at <= BASELINE_SECONDS);
    if (!previous || Math.floor(previous.received_at / DAY) !== day || inactive) rolling.push(observation);
    previous = observation;
  }

  return {
    decisions,
    history: [...history.values()],
    reputation: {
      accepted_days: acceptedDays.size,
      first_accepted_at: firstAccepted,
      last_accepted_at: previous?.received_at ?? 0,
      tier,
    },
  };
}
