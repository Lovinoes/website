export type AuthMode = 'unauthenticated' | 'authenticated';
export type Operation = 'health' | 'login' | 'account' | 'listServers' | 'websocketCredentials';

export interface LoadProfile {
  concurrency: number;
  requests?: number;
  durationMs?: number;
  warmupMs?: number;
}

export interface Scenario {
  name: string;
  operation: Operation;
  auth: AuthMode;
  load: LoadProfile;
}

export interface ResourceLimit {
  cpus: number;
  memoryMb?: number;
}

export interface LatencyStats {
  min?: number;
  max?: number;
  mean?: number;
  p50?: number;
  p90?: number;
  p95?: number;
  p99?: number;
}

export interface ResourceUsage {
  cpuPercentMean?: number;
  cpuPercentMax?: number;
  memMbMean?: number;
  memMbMax: number;
  samples?: number;
}

export interface ScenarioResult {
  scenario: Scenario;
  ok?: number;
  ratelimited?: number;
  failed?: number;
  errored?: number;
  elapsedMs?: number;
  throughput: number;
  latency: LatencyStats | null;
  statusCounts?: Partial<Record<number, number>>;
  resources?: ResourceUsage | null;
}

export interface VariantReport {
  limit: ResourceLimit;
  results: ScenarioResult[];
}

export interface SuiteReport {
  panel: string;
  startedAt?: string;
  variants: VariantReport[];
}

export interface SystemBenchmark {
  system: string;
  report: SuiteReport;
}

export interface PanelBenchmarks {
  name: string;
  version?: string;
  icon: string;
  color: string;
  systems: SystemBenchmark[];
}
