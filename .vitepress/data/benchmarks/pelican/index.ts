import type { PanelBenchmarks } from '../types.ts';
import altraQ8030 from './altra-q80-30.ts';
import epyc7443p from './epyc-7443p.ts';
import i512500 from './i5-12500.ts';
import ryzen9900x from './ryzen-9900x.ts';
import xeonE52680v2 from './xeon-e5-2680v2.ts';

export default {
  name: 'Pelican',
  version: '1.0.0-beta35',
  icon: '/vendor/pelican.png',
  color: '#6366f1',
  systems: [ryzen9900x, epyc7443p, xeonE52680v2, i512500, altraQ8030],
} satisfies PanelBenchmarks;
