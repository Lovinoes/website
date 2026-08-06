import { markdownCandidates } from '../.vitepress/lib/markdown-candidates.ts';

interface AssetsBinding {
  fetch(request: Request): Promise<Response>;
}

interface Env {
  ASSETS: AssetsBinding;
}

interface EventContext {
  request: Request;
  env: Env;
  next(): Promise<Response>;
}

export async function onRequest(context: EventContext): Promise<Response> {
  const { request, env, next } = context;
  if (request.method !== 'GET' && request.method !== 'HEAD') return next();

  const accept = request.headers.get('Accept') ?? '';
  if (!accept.includes('text/markdown')) return next();

  const url = new URL(request.url);
  for (const candidate of markdownCandidates(url.pathname)) {
    const assetUrl = new URL(candidate, url.origin);
    const response = await env.ASSETS.fetch(new Request(assetUrl, request));
    if (response.status === 404) continue;

    const headers = new Headers(response.headers);
    headers.set('Content-Type', 'text/markdown; charset=utf-8');
    return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
  }

  return next();
}
