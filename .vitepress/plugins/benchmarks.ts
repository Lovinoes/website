import {
  benchmarks,
  cpuOptions,
  type PanelId,
  panelIds,
  runDate,
  type ScenarioResult,
  scenarios,
  systems,
  type VariantReport,
} from '../data/benchmarks/index.ts';

export const BENCHMARKS_PAGE = 'docs/about/benchmarks.md';

const FRONTMATTER_RE = /^---\r?\n[\s\S]*?\r?\n---\r?\n+/;

const isNum = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);

const fmtRps = (value: number | null | undefined): string =>
  isNum(value) ? Math.round(value).toLocaleString('en-US') : '-';

const fmtMs = (value: number | null | undefined): string =>
  isNum(value) ? (value >= 10 ? Math.round(value).toString() : value.toFixed(1)) : '-';

const fmtInt = (value: number | null | undefined): string => (isNum(value) ? Math.round(value).toString() : '-');

const maxOf = (values: (number | null | undefined)[]): number | null => {
  const nums = values.filter(isNum);
  return nums.length > 0 ? Math.max(...nums) : null;
};

const minOf = (values: (number | null | undefined)[]): number | null => {
  const nums = values.filter(isNum);
  return nums.length > 0 ? Math.min(...nums) : null;
};

const panelLabel = (id: PanelId): string => benchmarks[id].name;

const panelWithVersion = (id: PanelId): string =>
  benchmarks[id].version ? `${benchmarks[id].name} ${benchmarks[id].version}` : benchmarks[id].name;

const variantOf = (id: PanelId, systemIndex: number, cpus: number): VariantReport | undefined =>
  benchmarks[id].systems[systemIndex]?.report.variants.find((variant) => variant.limit.cpus === cpus);

const resultOf = (variant: VariantReport | undefined, scenario: string): ScenarioResult | undefined =>
  variant?.results.find((result) => result.scenario.name === scenario);

type ResultPick = (result: ScenarioResult) => number | null | undefined;

const panelValues = (id: PanelId, pick: ResultPick): number[] =>
  benchmarks[id].systems
    .flatMap((bench) => bench.report.variants.flatMap((variant) => variant.results.map(pick)))
    .filter(isNum);

const systemValues = (id: PanelId, systemIndex: number, pick: ResultPick): number[] =>
  (benchmarks[id].systems[systemIndex]?.report.variants ?? [])
    .flatMap((variant) => variant.results.map(pick))
    .filter(isNum);

function table(header: string[], rows: string[][]): string {
  return [
    `| ${header.join(' | ')} |`,
    `| ${header.map(() => '---').join(' | ')} |`,
    ...rows.map((row) => `| ${row.join(' | ')} |`),
  ].join('\n');
}

const panelHeader = ['System', ...panelIds.map(panelLabel)];

const bySystem = (cell: (id: PanelId, systemIndex: number) => string): string[][] =>
  systems.map((system, index) => [system.name, ...panelIds.map((id) => cell(id, index))]);

function environmentsTable(): string {
  return table(
    ['System', 'CPU', 'Memory'],
    systems.map((system) => [system.name, system.cpu, system.ram]),
  );
}

function headlineTable(): string {
  return table(
    ['Panel', 'Peak throughput (req/s)', 'Best mean latency (ms)', 'Worst-case peak memory (MiB)'],
    panelIds.map((id) => [
      panelLabel(id),
      fmtRps(maxOf(panelValues(id, (result) => result.throughput))),
      fmtMs(minOf(panelValues(id, (result) => result.latency?.mean))),
      fmtInt(maxOf(panelValues(id, (result) => result.resources?.memMbMax))),
    ]),
  );
}

function resourcePeaksTable(): string {
  return table(
    panelHeader,
    bySystem((id, systemIndex) => {
      const cpu = maxOf(systemValues(id, systemIndex, (result) => result.resources?.cpuPercentMax));
      const mem = maxOf(systemValues(id, systemIndex, (result) => result.resources?.memMbMax));
      return isNum(cpu) || isNum(mem) ? `${fmtInt(cpu)}% / ${fmtInt(mem)} MiB` : '-';
    }),
  );
}

function scenarioTables(label: string, cell: (id: PanelId, systemIndex: number, scenario: string) => string): string {
  const blocks = [`### ${label}`];
  for (const scenario of scenarios) {
    blocks.push(
      `**${scenario}**`,
      table(
        panelHeader,
        bySystem((id, systemIndex) => cell(id, systemIndex, scenario)),
      ),
    );
  }
  return blocks.join('\n\n');
}

function cpuSection(cpus: number): string {
  const heading = `## ${cpus} ${cpus === 1 ? 'CPU' : 'CPUs'}`;

  const throughput = scenarioTables('Throughput (req/s, higher is better)', (id, systemIndex, scenario) =>
    fmtRps(resultOf(variantOf(id, systemIndex, cpus), scenario)?.throughput),
  );

  const latency = scenarioTables('Latency (ms, mean / p99, lower is better)', (id, systemIndex, scenario) => {
    const stats = resultOf(variantOf(id, systemIndex, cpus), scenario)?.latency;
    return isNum(stats?.mean) || isNum(stats?.p99) ? `${fmtMs(stats?.mean)} / ${fmtMs(stats?.p99)}` : '-';
  });

  const memory = [
    '### Memory (MiB, mean / peak under load, lower is better)',
    table(
      panelHeader,
      bySystem((id, systemIndex) => {
        const results = variantOf(id, systemIndex, cpus)?.results ?? [];
        const mean = maxOf(results.map((result) => result.resources?.memMbMean));
        const peak = maxOf(results.map((result) => result.resources?.memMbMax));
        return isNum(mean) || isNum(peak) ? `${fmtInt(mean)} / ${fmtInt(peak)}` : '-';
      }),
    ),
  ].join('\n\n');

  return [heading, throughput, latency, memory].join('\n\n');
}

function benchmarksDataMarkdown(): string {
  return [
    '## Panels compared',
    `${panelIds.map(panelWithVersion).join(', ')}. Every figure below comes from the benchmarking ` +
      `suite's JSON reports checked into this site; the run is dated ${runDate}. Each panel is swept ` +
      'across container CPU quotas of 1, 2, 4, and 8 CPUs, and every scenario is run against all five ' +
      'test systems below.',
    '## Test environments',
    environmentsTable(),
    '## Headline results',
    'Best value for each panel across every scenario, test system, and CPU limit.',
    headlineTable(),
    '## Observed resource peaks',
    'Highest CPU and memory use seen for each panel on each system, across all CPU limits and scenarios (`peak cpu` / `peak mem`).',
    resourcePeaksTable(),
    ...cpuOptions.map(cpuSection),
  ].join('\n\n');
}

interface ExpandOptions {
  keepFrontmatter?: boolean;
}

/**
 * Replace the interactive body of `benchmarks.md` with static data tables built
 * from the same typed reports the charts read.
 */
export function expandBenchmarksMarkdown(source: string, options: ExpandOptions = {}): string {
  const frontmatter = options.keepFrontmatter ? (source.match(FRONTMATTER_RE)?.[0] ?? '') : '';
  const body = source
    .replace(FRONTMATTER_RE, '')
    .replace(/<script setup(?:\s[^>]*)?>[\s\S]*?<\/script>\s*/g, '')
    .replace(/<style(?:\s[^>]*)?>[\s\S]*?<\/style>\s*/g, '');

  const intro =
    body.match(/^#\s+Benchmarks\s*\r?\n+([\s\S]*?)\r?\n+</m)?.[1]?.trim() ??
    'Performance results for Calagopus, measured against other panels on identical hardware.';

  const methodology = (body.match(/^::: info Methodology\r?\n[\s\S]*?\r?\n:::/m)?.[0] ?? '').replace(
    /\{\{\s*runDate\s*\}\}/g,
    runDate,
  );

  const detailedComparisons = body.match(/^##\s+Detailed comparisons\b[\s\S]*/m)?.[0]?.trim() ?? '';

  return `${[`${frontmatter}# Benchmarks`, intro, methodology, benchmarksDataMarkdown(), detailedComparisons]
    .filter(Boolean)
    .join('\n\n')}\n`;
}
