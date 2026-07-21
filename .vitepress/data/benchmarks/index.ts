import calagopus from './calagopus/index.ts';
import featherpanel from './featherpanel/index.ts';
import hydrodactyl from './hydrodactyl/index.ts';
import pelican from './pelican/index.ts';
import pterodactyl from './pterodactyl/index.ts';
import pufferpanel from './pufferpanel/index.ts';
import { systems } from './systems.ts';
import type { VariantReport } from './types.ts';

export { systems } from './systems.ts';
export type * from './types.ts';

export const benchmarks = { calagopus, featherpanel, hydrodactyl, pelican, pterodactyl, pufferpanel } as const;

export type PanelId = keyof typeof benchmarks;
export const panelIds = Object.keys(benchmarks) as PanelId[];

for (const [id, panel] of Object.entries(benchmarks)) {
  panel.systems.forEach((bench, i) => {
    if (bench.system !== systems[i].id) {
      throw new Error(`${id}: expected system ${systems[i].id} at index ${i}, got ${bench.system}`);
    }
  });
}

export const scenarios: string[] = benchmarks.calagopus.systems[0].report.variants[0].results.map(
  (r) => r.scenario.name,
);

export const cpuOptions: number[] = benchmarks.calagopus.systems[0].report.variants.map((v) => v.limit.cpus);

type MetricSeries = Record<PanelId, (number | null)[]>;

function metric(pick: (v: VariantReport) => number | null): MetricSeries {
  return Object.fromEntries(
    panelIds.map((id) => [id, benchmarks[id].systems.flatMap((bench) => bench.report.variants.map(pick))]),
  ) as MetricSeries;
}

const max = (values: (number | null | undefined)[]) => {
  const nums = values.filter((v): v is number => typeof v === 'number');
  return nums.length > 0 ? Math.max(...nums) : null;
};

export const metrics = {
  memMean: metric((v) => max(v.results.map((r) => r.resources?.memMbMean))),
  memPeak: metric((v) => max(v.results.map((r) => r.resources?.memMbMax))),
  cpuPeak: metric((v) => max(v.results.map((r) => r.resources?.cpuPercentMax))),
  perScenario: [] as {
    name: string;
    throughput: MetricSeries;
    latMean: MetricSeries;
    latP99: MetricSeries;
  }[],
};

for (const name of scenarios) {
  const of = (v: VariantReport) => v.results.find((r) => r.scenario.name === name);
  metrics.perScenario.push({
    name,
    throughput: metric((v) => of(v)?.throughput ?? null),
    latMean: metric((v) => of(v)?.latency?.mean ?? null),
    latP99: metric((v) => of(v)?.latency?.p99 ?? null),
  });
}

const min = (values: (number | null)[]) => Math.min(...values.filter((v): v is number => v !== null));
const maxOf = (values: (number | null)[]) => Math.max(...values.filter((v): v is number => v !== null));

function perPanel(pick: (id: PanelId) => number): Record<PanelId, number> {
  return Object.fromEntries(panelIds.map((id) => [id, pick(id)])) as Record<PanelId, number>;
}

export const headline = {
  peakRps: perPanel((id) => maxOf(metrics.perScenario.flatMap((s) => s.throughput[id]))),
  bestAvgLatencyMs: perPanel((id) => min(metrics.perScenario.flatMap((s) => s.latMean[id]))),
  peakMemMb: perPanel((id) => maxOf(metrics.memPeak[id])),
};

export const runDate: string = panelIds
  .flatMap((id) => benchmarks[id].systems.map((b) => b.report.startedAt ?? ''))
  .filter(Boolean)
  .sort()[0]
  .slice(0, 10);
