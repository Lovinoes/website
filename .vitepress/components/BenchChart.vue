<script setup>
import { BarChart, LineChart } from 'echarts/charts';
import {
  GridComponent,
  LegendComponent,
  MarkLineComponent,
  TitleComponent,
  TooltipComponent,
} from 'echarts/components';
import { use } from 'echarts/core';
import { CanvasRenderer } from 'echarts/renderers';
import { computed, onMounted, onUnmounted, ref } from 'vue';
import VChart, { THEME_KEY } from 'vue-echarts';

use([
  CanvasRenderer,
  BarChart,
  LineChart,
  GridComponent,
  TooltipComponent,
  LegendComponent,
  TitleComponent,
  MarkLineComponent,
]);

const props = defineProps({
  option: { type: Object, required: true },
  height: { type: String, default: '320px' },
});

const isDark = ref(false);
let observer = null;

onMounted(() => {
  const update = () => {
    isDark.value = document.documentElement.classList.contains('dark');
  };
  update();
  observer = new MutationObserver(update);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
});

onUnmounted(() => {
  if (observer) observer.disconnect();
});

const themedOption = computed(() => {
  const base = props.option;
  const text = isDark.value ? '#d4d4d4' : '#2a2a2a';
  const muted = isDark.value ? '#8a8a8a' : '#6a6a6a';
  const grid = isDark.value ? '#2a2a2a' : '#e8e6e1';
  const bg = isDark.value ? 'rgba(20,20,20,0.95)' : 'rgba(255,253,250,0.98)';

  return {
    ...base,
    backgroundColor: 'transparent',
    textStyle: { color: text, fontFamily: 'inherit' },
    tooltip: {
      ...(base.tooltip || {}),
      backgroundColor: bg,
      borderColor: grid,
      textStyle: { color: text, fontFamily: 'inherit' },
    },
    legend: base.legend ? { ...base.legend, textStyle: { color: text, fontFamily: 'inherit' } } : undefined,
    xAxis: applyAxisTheme(base.xAxis, text, muted, grid),
    yAxis: applyAxisTheme(base.yAxis, text, muted, grid),
  };
});

function applyAxisTheme(axis, text, muted, grid) {
  if (!axis) return axis;
  if (Array.isArray(axis)) return axis.map((a) => applyAxisTheme(a, text, muted, grid));
  return {
    ...axis,
    axisLabel: { color: muted, fontFamily: 'inherit', ...(axis.axisLabel || {}) },
    nameTextStyle: { color: muted, fontFamily: 'inherit', ...(axis.nameTextStyle || {}) },
    axisLine: { lineStyle: { color: grid }, ...(axis.axisLine || {}) },
    splitLine: { lineStyle: { color: grid, type: 'dashed' }, ...(axis.splitLine || {}) },
  };
}

// The chart itself only exists after client-side ECharts rendering, so this
// table is the server-rendered (crawlable, screen-reader-accessible) copy of
// the same data.
const dataTable = computed(() => {
  const base = props.option;
  const yAxis = Array.isArray(base.yAxis) ? base.yAxis[0] : base.yAxis;
  const categories = yAxis?.data ?? [];
  const series = (base.series ?? []).filter((s) => Array.isArray(s.data));
  if (!categories.length || !series.length) return null;
  const xAxis = Array.isArray(base.xAxis) ? base.xAxis[0] : base.xAxis;
  return { categories, series, unit: xAxis?.name ?? '' };
});

const fmtCell = (v) => {
  if (typeof v !== 'number') return 'no data';
  return Number.isInteger(v) ? v.toLocaleString('en-US') : v.toFixed(1);
};
</script>

<template>
  <div class="bench-chart" :style="{ height }">
    <v-chart :option="themedOption" :update-options="{ notMerge: true }" autoresize />
  </div>
  <details v-if="dataTable" class="bench-data">
    <summary>View this chart's data as a table</summary>
    <div class="bench-data-scroll">
      <table>
        <thead>
          <tr>
            <th scope="col">System</th>
            <th v-for="s in dataTable.series" :key="s.name" scope="col">
              {{ s.name }}<template v-if="dataTable.unit"> ({{ dataTable.unit }})</template>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(cat, i) in dataTable.categories" :key="cat">
            <th scope="row">{{ cat }}</th>
            <td v-for="s in dataTable.series" :key="s.name">{{ fmtCell(s.data[i]) }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  </details>
</template>

<style scoped>
.bench-chart {
  width: 100%;
  margin: 1rem 0;
}

.bench-data {
  margin: 0 0 0.6rem;
  font-size: 0.78rem;
}

.bench-data summary {
  cursor: pointer;
  color: var(--vp-c-text-3);
  user-select: none;
}

.bench-data summary:hover {
  color: var(--vp-c-brand-1);
}

.bench-data-scroll {
  overflow-x: auto;
  margin-top: 0.5rem;
}

.bench-data table {
  border-collapse: collapse;
  width: 100%;
}

.bench-data th,
.bench-data td {
  padding: 0.3rem 0.6rem;
  border: 1px solid var(--vp-c-divider);
  text-align: right;
  font-feature-settings: 'tnum';
  white-space: nowrap;
}

.bench-data th[scope='row'],
.bench-data thead th:first-child {
  text-align: left;
  color: var(--vp-c-text-1);
}
</style>
