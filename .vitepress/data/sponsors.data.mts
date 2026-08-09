import { defineLoader } from 'vitepress';
import { loadSponsors, type SponsorsData } from '../plugins/sponsors.ts';

export type { Sponsor, SponsorProfile, SponsorStatus, SponsorsData } from '../plugins/sponsors.ts';

declare const data: SponsorsData;

export { data };

export default defineLoader({
  async load(): Promise<SponsorsData> {
    return await loadSponsors();
  },
});
