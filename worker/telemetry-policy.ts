export const POLICY_VERSION = 1;

const DAY = 86_400;
const PROBATION_DAYS = 3;
const PROBATION_SECONDS = 2 * DAY;
const ESTABLISHED_DAYS = 14;
const ESTABLISHED_SECONDS = 21 * DAY;
const INACTIVITY_SECONDS = 30 * DAY;

export const METRICS = [
  'users_total',
  'servers_total',
  'backups_total',
  'node_count',
  'database_agent_host_count',
  'node_memory_bytes',
  'servers_online',
] as const;

type Metric = (typeof METRICS)[number];
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
  let tier: ReputationTier = 'new';

  for (const observation of observations) {
    const day = Math.floor(observation.received_at / DAY);
    const inactive = previous !== undefined && observation.received_at - previous.received_at >= INACTIVITY_SECONDS;
    let reason = '';

    if (observation.action === 'quarantine') reason = 'manual_quarantine';
    else if (
      !observation.valid ||
      METRICS.some((metric) => !Number.isSafeInteger(observation[metric]) || observation[metric] < 0)
    )
      reason = 'invalid_observation';
    else if (observation.action !== 'approve') {
      const extreme = METRICS.find((metric) => observation[metric] > LIMITS[metric]);
      if (extreme) reason = `limit:${extreme}`;
      else if (previous) {
        const lastAccepted = previous;
        const baseline = rolling.find((entry) => observation.received_at - entry.received_at <= 30 * DAY) ?? previous;
        const growth = METRICS.find((metric) =>
          [lastAccepted, baseline].some(
            (entry) => observation[metric] > Math.max(entry[metric] * 5, entry[metric] + GROWTH_ALLOWANCE[metric]),
          ),
        );
        if (growth) reason = `growth:${growth}`;
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
      reason: observation.action === 'approve' ? 'manual_approval' : eligible ? 'accepted' : 'probation',
    });
    if (eligible) history.set(day, observation);
    rolling = rolling.filter((entry) => observation.received_at - entry.received_at <= 30 * DAY);
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
