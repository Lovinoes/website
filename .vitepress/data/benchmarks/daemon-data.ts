import { daemonIds, daemons } from './daemons/index.ts';
import { assertCoverage, assertSingleRun, targetVersion } from './shared.ts';
import { systems } from './systems.ts';
import type { ScenarioResult, TaskOperation } from './types.ts';

export type { DaemonId } from './daemons/index.ts';
export { daemonIds, daemons } from './daemons/index.ts';

export const daemonCoveredSystems: string[] = assertCoverage('daemons', daemons);
export const daemonRunDate: string = assertSingleRun('daemons', daemons);
export const daemonChartSystems = systems.filter((system) => daemonCoveredSystems.includes(system.id));
export const daemonPendingSystems = systems.filter((system) => !daemonCoveredSystems.includes(system.id));

export const daemonVersions: Record<string, string | null> = Object.fromEntries(
  daemonIds.map((id) => [id, targetVersion(daemons[id])]),
);

export const daemonCpuOptions: number[] = daemons.calagopus.systems[0].report.variants.map((v) => v.limit.cpus);

export interface DaemonScenario {
  name: string;
  kind: ScenarioResult['kind'];
  operation: string;
  missingFrom: string[];
  hasBytes: boolean;
}

function buildScenarios(): DaemonScenario[] {
  const widest = daemonIds
    .map((id) => daemons[id].systems[0].report.variants[0].results)
    .sort((a, b) => b.length - a.length)[0];

  return widest.map((result) => {
    const name = result.scenario.name;
    const missingFrom = daemonIds.filter(
      (id) => !daemons[id].systems[0].report.variants[0].results.some((r) => r.scenario.name === name),
    );
    return {
      name,
      kind: result.kind,
      operation: result.scenario.operation,
      missingFrom,
      hasBytes: result.kind === 'task' && result.bytes > 0,
    };
  });
}

export const daemonScenarios: DaemonScenario[] = buildScenarios();
export const loadScenarios = daemonScenarios.filter((s) => s.kind === 'load');
export const taskScenarios = daemonScenarios.filter((s) => s.kind === 'task');

const FAMILY_LABELS: Record<string, string> = {
  compress: 'Compression',
  decompress: 'Decompression',
  deleteTree: 'Deletion',
  writeFile: 'Transfer',
  listDirectory: 'Large directory listings',
};

export const taskFamilies = (Object.keys(FAMILY_LABELS) as TaskOperation[])
  .map((operation) => ({
    operation,
    label: FAMILY_LABELS[operation],
    scenarios: taskScenarios.filter((s) => s.operation === operation),
  }))
  .filter((family) => family.scenarios.length > 0);
