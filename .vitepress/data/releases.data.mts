import { defineLoader } from 'vitepress';
import { loadReleases, type ReleasesData } from '../plugins/releases.ts';

export type { ProjectReleases, Release, ReleaseAsset, ReleasesData } from '../plugins/releases.ts';

declare const data: ReleasesData;

export { data };

export default defineLoader({
  async load(): Promise<ReleasesData> {
    return await loadReleases();
  },
});
