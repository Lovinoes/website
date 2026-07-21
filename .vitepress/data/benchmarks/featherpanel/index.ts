import type { PanelBenchmarks } from '../types.ts';
import altraQ8030 from './altra-q80-30.ts';
import epyc7443p from './epyc-7443p.ts';
import i512500 from './i5-12500.ts';
import ryzen9900x from './ryzen-9900x.ts';
import xeonE52680v2 from './xeon-e5-2680v2.ts';

export default {
  name: 'FeatherPanel',
  version: '1.3.7.4',
  icon: '/vendor/featherpanel.png',
  color: '#a855f7',
  systems: [ryzen9900x, epyc7443p, xeonE52680v2, i512500, altraQ8030],
} satisfies PanelBenchmarks;
