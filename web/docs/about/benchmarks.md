---
title: Benchmarks
description: Performance benchmarks comparing Calagopus with Pterodactyl, Pelican, PufferPanel, FeatherPanel, and Hydrodactyl across throughput, latency, memory, and CPU usage on identical hardware.
---

<script setup>
import { computed, ref } from 'vue'
import BenchChart from '../../../.vitepress/components/BenchChart.vue'
import { benchmarks, cpuOptions, panelIds, runDate, scenarios, systems } from '../../../.vitepress/data/benchmarks/index.ts'

const active = ref(new Set(panelIds))
const selectedCpus = ref(cpuOptions[cpuOptions.length - 1])

const toggle = (id) => {
  const next = new Set(active.value)
  if (next.has(id)) {
    if (next.size > 1) next.delete(id)
  } else {
    next.add(id)
  }
  active.value = next
}

const activeIds = computed(() => panelIds.filter((id) => active.value.has(id)))

const systemLabels = systems.map((s) => s.shortName)

const maxNum = (vals) => {
  const nums = vals.filter((x) => typeof x === 'number')
  return nums.length ? Math.max(...nums) : null
}

const variantAt = (id, i) =>
  benchmarks[id].systems[i].report.variants.find((v) => v.limit.cpus === selectedCpus.value)

const seriesFor = (pick) => Object.fromEntries(activeIds.value.map((id) => [
  id,
  systems.map((_, i) => {
    const v = variantAt(id, i)
    return v ? pick(v) : null
  }),
]))

const baseHorizontal = (extra = {}) => ({
  grid: { left: 170, right: 30, top: 56, bottom: 40, ...extra.grid },
  legend: { top: 4, left: 8, icon: 'roundRect', itemWidth: 12, itemHeight: 12 },
  tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
  yAxis: {
    type: 'category',
    data: systemLabels,
    inverse: true,
    axisTick: { show: false },
    axisLabel: { fontFamily: 'ui-monospace, monospace', fontSize: 11 },
  },
  ...extra,
})

const bars = (m) => activeIds.value.map((id) => ({
  name: benchmarks[id].name,
  type: 'bar',
  data: m[id],
  color: benchmarks[id].color,
  barMaxWidth: 16,
  itemStyle: { borderRadius: [0, 3, 3, 0] },
}))

const memChart = (m) => baseHorizontal({
  xAxis: { type: 'value', name: 'MiB' },
  tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, valueFormatter: v => v == null ? 'no data' : `${Math.round(v)} MiB` },
  series: bars(m),
})

const rpsChart = (m) => baseHorizontal({
  xAxis: { type: 'value', name: 'req/s', axisLabel: { formatter: v => v >= 1000 ? `${v/1000}k` : v } },
  tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, valueFormatter: v => v == null ? 'no data' : `${Math.round(v).toLocaleString()} req/s` },
  series: bars(m),
})

const latChart = (m) => baseHorizontal({
  xAxis: { type: 'value', name: 'ms' },
  tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, valueFormatter: v => v == null ? 'no data' : `${v.toFixed(1)} ms` },
  series: bars(m),
})

const memMean = computed(() => memChart(seriesFor((v) => maxNum(v.results.map((r) => r.resources?.memMbMean)))))
const memPeak = computed(() => memChart(seriesFor((v) => maxNum(v.results.map((r) => r.resources?.memMbMax)))))

const scenarioCharts = computed(() => scenarios.map((name) => {
  const result = (v) => v.results.find((r) => r.scenario.name === name)
  return {
    name,
    rps: rpsChart(seriesFor((v) => result(v)?.throughput ?? null)),
    latMean: latChart(seriesFor((v) => result(v)?.latency?.mean ?? null)),
    latP99: latChart(seriesFor((v) => result(v)?.latency?.p99 ?? null)),
  }
}))

const envStats = (i) => activeIds.value.flatMap((id) => {
  const results = benchmarks[id].systems[i].report.variants.flatMap((v) => v.results)
  const cpu = Math.max(...results.map((r) => r.resources?.cpuPercentMax ?? 0))
  const mem = Math.max(...results.map((r) => r.resources?.memMbMax ?? 0))
  return cpu > 0 || mem > 0
    ? [{
        id,
        name: benchmarks[id].name,
        color: benchmarks[id].color,
        cpu: cpu > 0 ? `${Math.round(cpu)}%` : '-',
        mem: mem > 0 ? `${Math.round(mem)} MiB` : '-',
      }]
    : []
})

const fmtK = (v) => v >= 10000 ? `${Math.floor(v / 1000)}k` : Math.round(v).toLocaleString()
const fmtMs = (v) => v >= 10 ? Math.round(v).toString() : v.toFixed(1)

const scenarioValues = (id, pick) => benchmarks[id].systems.flatMap((bench) => {
  const v = bench.report.variants.find((x) => x.limit.cpus === selectedCpus.value)
  return v ? v.results.map(pick).filter((x) => typeof x === 'number') : []
})

const headlineNow = computed(() => {
  const per = (pick, mode) => Object.fromEntries(panelIds.map((id) => {
    const vals = scenarioValues(id, pick)
    return [id, vals.length ? (mode === 'max' ? Math.max(...vals) : Math.min(...vals)) : NaN]
  }))
  return {
    peakRps: per((r) => r.throughput, 'max'),
    bestAvgLatencyMs: per((r) => r.latency?.mean, 'min'),
    peakMemMb: per((r) => r.resources?.memMbMax, 'max'),
  }
})

const statRows = (values, better, fmt) => activeIds.value
  .map((id) => ({ id, name: benchmarks[id].name, color: benchmarks[id].color, value: fmt(values[id]) }))
  .sort((a, b) => better === 'high' ? values[b.id] - values[a.id] : values[a.id] - values[b.id])

const statCards = computed(() => [
  {
    label: 'peak throughput',
    value: fmtK(headlineNow.value.peakRps.calagopus),
    unit: 'req/s',
    rows: statRows(headlineNow.value.peakRps, 'high', fmtK),
  },
  {
    label: 'avg response',
    value: fmtMs(headlineNow.value.bestAvgLatencyMs.calagopus),
    unit: 'ms',
    rows: statRows(headlineNow.value.bestAvgLatencyMs, 'low', (v) => `${fmtMs(v)} ms`),
  },
  {
    label: 'peak memory',
    value: Math.round(headlineNow.value.peakMemMb.calagopus).toString(),
    unit: 'MiB',
    rows: statRows(headlineNow.value.peakMemMb, 'low', (v) => `${Math.round(v)} MiB`),
  },
])

const chartHeight = (systemLabels.length * 52 + 110) + 'px'
</script>

# Benchmarks

Performance results for Calagopus, measured against five other panels on identical hardware. Each chart compares every panel across every test configuration.

<div class="panel-strip" role="group" aria-label="Toggle panels shown in the charts">
  <button
    v-for="id in panelIds"
    :key="id"
    type="button"
    class="panel-chip"
    :class="{ inactive: !active.has(id) }"
    :aria-pressed="active.has(id)"
    @click="toggle(id)"
  >
    <span class="chip-dot" :style="{ background: benchmarks[id].color }"></span>
    <img :src="benchmarks[id].icon" :alt="''" height="16" />
    <span class="chip-name">{{ benchmarks[id].name }}</span>
    <code v-if="benchmarks[id].version" class="chip-version">{{ benchmarks[id].version }}</code>
  </button>
</div>
<div class="controls">
  <p class="panel-hint">Click a panel to show or hide it in the charts below.</p>
  <label class="cpu-select">
    <span>CPU limit</span>
    <select v-model.number="selectedCpus">
      <option v-for="c in cpuOptions" :key="c" :value="c">{{ c }} {{ c === 1 ? 'CPU' : 'CPUs' }}</option>
    </select>
  </label>
</div>

<div class="headline-stats">
  <div v-for="card in statCards" :key="card.label" class="stat">
    <div class="stat-label">{{ card.label }} · {{ selectedCpus }}c</div>
    <div class="stat-value">{{ card.value }} <span>{{ card.unit }}</span></div>
    <div class="stat-sub">
      <div
        v-for="row in card.rows"
        :key="row.id"
        class="stat-row"
        :class="{ self: row.id === 'calagopus' }"
      >
        <i :style="{ background: row.color }"></i>
        <span class="stat-row-value">{{ row.value }}</span>
        <span class="stat-row-name">{{ row.name }}</span>
      </div>
    </div>
  </div>
</div>

::: info Methodology
All panels run from their official `:latest` Docker images (as of {{ runDate }}) with no configuration beyond initial setup. Runs are driven by our open-source [benchmarking suite](https://github.com/calagopus/benchmarking): each panel boots from its own Docker Compose stack and is swept across CPU-quota variants (1, 2, 4, and 8 CPUs) while container CPU and memory are sampled. Every scenario runs 384 concurrent connections for 10 seconds after a 1-second warmup, against three endpoints: public settings (unauthenticated), account details (authenticated), and the server list (authenticated). All panels keep their default rate limiting; high `[429]` counts on authenticated endpoints are expected.

Configurations are labeled `<CPU> · <cores>c`. The numbers on this page are the suite's JSON reports (`pnpm run bench <panel> --json`) checked into the site as typed data - anyone can reproduce a run and compare.
:::

## Test environments

<div class="env-table">
  <details v-for="(sys, i) in systems" :key="sys.id" class="env-item">
    <summary class="env-line">
      <span class="env-name">{{ sys.name }}</span>
      <span class="env-spec">{{ sys.cpu }} · {{ sys.ram }}</span>
    </summary>
    <div class="env-detail">
      <div class="env-stat-row env-stat-head">
        <i></i>
        <span>panel</span>
        <span>peak cpu</span>
        <span>peak mem</span>
      </div>
      <div v-for="row in envStats(i)" :key="row.id" class="env-stat-row">
        <i :style="{ background: row.color }"></i>
        <span class="env-stat-name">{{ row.name }}</span>
        <span class="env-stat-val">{{ row.cpu }}</span>
        <span class="env-stat-val">{{ row.mem }}</span>
      </div>
    </div>
  </details>
</div>
<p class="panel-hint">Peaks are the highest values observed across all CPU configs and scenarios on that system.</p>

## Memory usage

<div class="chart-pair">
  <div class="chart-card">
    <div class="chart-cap"><span>Mean under load</span><select class="cap-select" v-model.number="selectedCpus" aria-label="CPU limit"><option v-for="c in cpuOptions" :key="c" :value="c">{{ c }}c</option></select></div>
    <p class="chart-sub">↓ Lower is better - less memory used while serving load.</p>
    <BenchChart :option="memMean" :height="chartHeight" />
  </div>
  <div class="chart-card">
    <div class="chart-cap"><span>Peak under load</span><select class="cap-select" v-model.number="selectedCpus" aria-label="CPU limit"><option v-for="c in cpuOptions" :key="c" :value="c">{{ c }}c</option></select></div>
    <p class="chart-sub">↓ Lower is better - smaller worst-case memory footprint.</p>
    <BenchChart :option="memPeak" :height="chartHeight" />
  </div>
</div>

## Throughput

<div class="chart-card" v-for="s in scenarioCharts" :key="`rps-${s.name}`">
  <div class="chart-cap"><span>Scenario: <code>{{ s.name }}</code></span><select class="cap-select" v-model.number="selectedCpus" aria-label="CPU limit"><option v-for="c in cpuOptions" :key="c" :value="c">{{ c }}c</option></select></div>
  <p class="chart-sub">↑ Higher is better - more requests served per second.</p>
  <BenchChart :option="s.rps" :height="chartHeight" />
</div>

## Average latency

<div class="chart-card" v-for="s in scenarioCharts" :key="`lat-${s.name}`">
  <div class="chart-cap"><span>Scenario: <code>{{ s.name }}</code></span><select class="cap-select" v-model.number="selectedCpus" aria-label="CPU limit"><option v-for="c in cpuOptions" :key="c" :value="c">{{ c }}c</option></select></div>
  <p class="chart-sub">↓ Lower is better - faster average response.</p>
  <BenchChart :option="s.latMean" :height="chartHeight" />
</div>

## p99 latency

<div class="chart-card" v-for="s in scenarioCharts" :key="`p99-${s.name}`">
  <div class="chart-cap"><span>Scenario: <code>{{ s.name }}</code></span><select class="cap-select" v-model.number="selectedCpus" aria-label="CPU limit"><option v-for="c in cpuOptions" :key="c" :value="c">{{ c }}c</option></select></div>
  <p class="chart-sub">↓ Lower is better - faster worst-case (p99) response.</p>
  <BenchChart :option="s.latP99" :height="chartHeight" />
</div>

## Detailed comparisons

Raw numbers are only part of the picture. For feature-by-feature breakdowns against specific panels, see [Calagopus vs Pterodactyl](/compare/calagopus-vs-pterodactyl), [Calagopus vs Pelican](/compare/calagopus-vs-pelican), and [Calagopus vs AMP](/compare/calagopus-vs-amp).

<style scoped>
.panel-strip {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 0.5rem;
  margin: 1.4rem 0 0;
}
.panel-chip {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 100%;
  padding: 0.45rem 0.75rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  background: var(--vp-c-bg-soft);
  font-size: 0.8rem;
  font-family: var(--vp-font-family-mono);
  cursor: pointer;
  transition: border-color 0.2s, opacity 0.2s, transform 0.1s;
  text-align: left;
}
.panel-chip:hover {
  border-color: var(--vp-c-brand-1);
}
.panel-chip:active {
  transform: scale(0.98);
}
.panel-chip.inactive {
  opacity: 0.45;
  border-style: dashed;
}
.panel-chip.inactive img,
.panel-chip.inactive .chip-dot {
  filter: grayscale(1);
}
.chip-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}
.panel-chip img {
  height: 16px;
  width: auto;
  border-radius: 3px;
  flex-shrink: 0;
}
.chip-name {
  font-weight: 600;
  color: var(--vp-c-text-1);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.chip-version {
  margin-left: auto;
  color: var(--vp-c-text-3);
  background: none;
  padding: 0;
  font-size: 0.72rem;
}
.controls {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 0.5rem 1rem;
  margin: 0.5rem 0 0;
}
.panel-hint {
  margin: 0;
  font-size: 0.78rem;
  color: var(--vp-c-text-3);
}
.cpu-select {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.72rem;
  font-family: var(--vp-font-family-mono);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--vp-c-text-3);
}
.cpu-select select {
  padding: 0.3rem 0.6rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  background: var(--vp-c-bg-soft);
  color: var(--vp-c-text-1);
  font-family: var(--vp-font-family-mono);
  font-size: 0.78rem;
  cursor: pointer;
  transition: border-color 0.2s;
}
.cpu-select select:hover,
.cpu-select select:focus {
  border-color: var(--vp-c-brand-1);
  outline: none;
}
.chart-sub {
  margin: 0 0 0.3rem;
  font-size: 0.72rem;
  color: var(--vp-c-text-3);
}
.cap-select {
  flex-shrink: 0;
  min-width: 3.4rem;
  padding: 0.15rem 0.45rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: 999px;
  background: var(--vp-c-bg);
  color: var(--vp-c-text-2);
  font-family: var(--vp-font-family-mono);
  font-size: 0.7rem;
  text-transform: none;
  letter-spacing: 0;
  cursor: pointer;
  transition: border-color 0.2s;
}
.cap-select:hover,
.cap-select:focus {
  border-color: var(--vp-c-brand-1);
  outline: none;
}

.headline-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
  gap: 0.9rem;
  margin: 1.6rem 0 2rem;
}
.stat {
  min-width: 0;
  padding: 0.9rem 1.1rem;
  background: var(--vp-c-bg-soft);
  border-radius: 10px;
}
.stat-label {
  font-size: 0.68rem;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: var(--vp-c-text-3);
  font-family: var(--vp-font-family-mono);
  margin-bottom: 0.3rem;
}
.stat-value {
  font-size: 1.7rem;
  font-weight: 700;
  line-height: 1;
  background: linear-gradient(90deg, #14b8a6, #2dd4bf);
  background-clip: text;
  -webkit-background-clip: text;
  color: transparent;
  font-feature-settings: 'tnum';
}
.stat-value span {
  font-size: 0.85rem;
  font-weight: 500;
  color: var(--vp-c-text-2);
  margin-left: 0.15rem;
}
.stat-sub {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  margin-top: 0.5rem;
  font-size: 0.72rem;
  color: var(--vp-c-text-2);
  font-family: var(--vp-font-family-mono);
  line-height: 1.4;
}
.stat-row {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  min-width: 0;
}
.stat-row i {
  width: 7px;
  height: 7px;
  border-radius: 50%;
  flex-shrink: 0;
}
.stat-row-value {
  font-feature-settings: 'tnum';
  min-width: 3.6em;
  color: var(--vp-c-text-2);
}
.stat-row-name {
  color: var(--vp-c-text-3);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.stat-row.self .stat-row-value,
.stat-row.self .stat-row-name {
  color: var(--vp-c-text-1);
  font-weight: 600;
}

.env-table {
  margin: 1.2rem 0 0.4rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: 10px;
  overflow: hidden;
  font-family: var(--vp-font-family-mono);
  font-size: 0.82rem;
}
/* Reset the VitePress .vp-doc details/summary theme styling. */
.env-item {
  margin: 0;
  padding: 0;
  border: none;
  border-radius: 0;
  background: var(--vp-c-bg-soft);
}
.env-item + .env-item {
  border-top: 1px solid var(--vp-c-divider);
}
.env-line {
  display: grid;
  grid-template-columns: minmax(150px, auto) 1fr auto;
  align-items: center;
  gap: 0.4rem 1rem;
  margin: 0;
  padding: 0.55rem 0.9rem;
  font-weight: 400;
  cursor: pointer;
  list-style: none;
  user-select: none;
}
.env-line::-webkit-details-marker {
  display: none;
}
.env-line::after {
  content: '+';
  font-size: 1rem;
  color: var(--vp-c-text-3);
  transition: transform 0.2s ease;
  justify-self: end;
}
.env-item[open] .env-line::after {
  transform: rotate(45deg);
}
.env-line:hover .env-name {
  color: var(--vp-c-brand-1);
}
.env-name {
  font-weight: 700;
  color: var(--vp-c-text-1);
  white-space: nowrap;
  transition: color 0.2s;
}
.env-spec {
  color: var(--vp-c-text-2);
  font-size: 0.76rem;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.env-detail {
  padding: 0.2rem 0.9rem 0.7rem;
}
.env-stat-row {
  display: grid;
  grid-template-columns: 10px 1fr 5.5rem 6.5rem;
  align-items: center;
  gap: 0.5rem;
  padding: 0.15rem 0;
  font-size: 0.76rem;
  color: var(--vp-c-text-2);
}
.env-stat-row i {
  width: 7px;
  height: 7px;
  border-radius: 50%;
}
.env-stat-head {
  font-size: 0.66rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--vp-c-text-3);
  border-bottom: 1px dashed var(--vp-c-divider);
  padding-bottom: 0.3rem;
  margin-bottom: 0.2rem;
}
.env-stat-head span:nth-child(n + 3) {
  text-align: right;
}
.env-stat-name {
  color: var(--vp-c-text-1);
}
.env-stat-val {
  text-align: right;
  font-feature-settings: 'tnum';
}
@media (max-width: 640px) {
  .env-line {
    grid-template-columns: 1fr auto;
  }
  .env-spec {
    grid-column: 1 / -1;
  }
}

.chart-card {
  margin: 1rem 0;
  padding: 0.8rem 1rem 0.4rem;
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  background: var(--vp-c-bg-soft);
}
.chart-cap {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.6rem;
  font-family: var(--vp-font-family-mono);
  font-size: 0.78rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--vp-c-text-3);
  margin: 0 0 0.2rem;
}
.chart-cap code {
  text-transform: none;
  letter-spacing: 0;
  background: none;
  padding: 0;
}
.chart-pair {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(360px, 1fr));
  gap: 1rem;
  margin: 0.5rem 0;
}
</style>
