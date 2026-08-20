import { wantsMarkdown } from '../http.ts';
import { handleLatest, handleReleases, RELEASES_PATTERN } from './releases.ts';
import { handleSponsors } from './sponsors.ts';

export const API_PREFIX = '/api/';

export async function apiHandler(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const pathname = url.pathname.endsWith('.md') ? url.pathname.slice(0, -3) : url.pathname;

  if (pathname === '/api/latest' || pathname === '/api/latest/') return handleLatest(request, env);

  if (pathname === '/api/sponsors' || pathname === '/api/sponsors/') return handleSponsors(request);

  const releases = pathname.match(RELEASES_PATTERN);
  if (releases) return handleReleases(request, env, releases, wantsMarkdown(request, url.pathname));

  return new Response('Not Found', { status: 404 });
}
