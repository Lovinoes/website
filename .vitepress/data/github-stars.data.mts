import { defineLoader } from 'vitepress';
import { type GitHubStarsData, loadGitHubStars } from '../plugins/github-stars.ts';

export type { GitHubStarsData } from '../plugins/github-stars.ts';

declare const data: GitHubStarsData;

export { data };

export default defineLoader({
  async load(): Promise<GitHubStarsData> {
    return await loadGitHubStars();
  },
});
