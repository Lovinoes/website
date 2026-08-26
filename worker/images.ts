const IMAGE_MANIFEST_ROUTE = '/_mcp/images.json';
const ORIGIN = 'https://assets.local';
const CHUNK = 0x8000;

const MIME_TYPES: Record<string, string> = {
  avif: 'image/avif',
  gif: 'image/gif',
  jpeg: 'image/jpeg',
  jpg: 'image/jpeg',
  png: 'image/png',
  svg: 'image/svg+xml',
  webp: 'image/webp',
};

export interface ManifestImage {
  path: string;
  asset: string;
  mime: string;
  bytes: number;
}

interface ImageManifest {
  generated_at: string;
  count: number;
  images: ManifestImage[];
}

// Same lifetime as the page manifest: per-isolate and never invalidated, which
// is safe because the Worker script and the assets it reads deploy together.
let cached: Map<string, ManifestImage> | undefined;

export async function loadImageManifest(env: Env): Promise<Map<string, ManifestImage>> {
  if (cached) return cached;

  const response = await env.ASSETS.fetch(new URL(IMAGE_MANIFEST_ROUTE, ORIGIN));
  if (!response.ok) throw new Error(`image manifest missing at ${IMAGE_MANIFEST_ROUTE} (HTTP ${response.status})`);

  const manifest = (await response.json()) as ImageManifest;
  cached = new Map(manifest.images.map((image) => [image.path, image]));
  return cached;
}

export function parseImageRef(value: string): string {
  try {
    return decodeURIComponent(new URL(value.trim(), ORIGIN).pathname);
  } catch {
    return value.trim();
  }
}

function mimeFor(path: string): string | undefined {
  return MIME_TYPES[path.split('.').pop()?.toLowerCase() ?? ''];
}

// The absolute paths in a page body address the source image, which the build
// only ever emits under a content hash. Callers serving those paths redirect to
// wherever the image actually landed.
export async function imageAsset(env: Env, path: string): Promise<string | null> {
  if (mimeFor(path) === undefined) return null;

  try {
    return (await loadImageManifest(env)).get(path)?.asset ?? null;
  } catch {
    return null;
  }
}

// Images copied verbatim out of `public/` keep their source path, so they never
// enter the manifest; the path is already the asset.
export async function resolveImage(env: Env, path: string): Promise<ManifestImage | null> {
  const mapped = (await loadImageManifest(env)).get(path);
  if (mapped) return mapped;

  const mime = mimeFor(path);
  if (mime === undefined) return null;

  const response = await env.ASSETS.fetch(new URL(path, ORIGIN), { method: 'HEAD' });
  if (!response.ok) return null;

  return { path, asset: path, mime, bytes: Number(response.headers.get('Content-Length') ?? 0) };
}

export async function readImage(env: Env, image: ManifestImage): Promise<Uint8Array | null> {
  const response = await env.ASSETS.fetch(new URL(image.asset, ORIGIN));
  if (!response.ok) return null;

  return new Uint8Array(await response.arrayBuffer());
}

export function base64(bytes: Uint8Array): string {
  let binary = '';
  for (let offset = 0; offset < bytes.length; offset += CHUNK) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + CHUNK));
  }
  return btoa(binary);
}
