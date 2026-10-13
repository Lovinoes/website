import sharp from 'sharp';

export type LogoTone = 'light' | 'dark';

const OPAQUE_ALPHA = 200;
const LIGHT_LUMINANCE = 200;
const DARK_LUMINANCE = 80;
const MIN_SHARE = 0.25;
const MIN_OPAQUE_SHARE = 0.01;
const SAMPLE_WIDTH = 256;
const MAX_BYTES = 8 * 1024 * 1024;
const TIMEOUT_MS = 10_000;

/**
 * Whether a transparent-background logo is mostly light or mostly dark ink, so the page can put a backing tile
 * behind it in the colour scheme it would otherwise vanish in. Mixed and mid-tone logos get `null` and render as-is.
 */
export async function classifyLogoTone(image: Buffer): Promise<LogoTone | null> {
  const { data, info } = await sharp(image)
    .resize({ width: SAMPLE_WIDTH, withoutEnlargement: true })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  let opaque = 0;
  let light = 0;
  let dark = 0;

  for (let i = 0; i < data.length; i += info.channels) {
    if (data[i + 3] < OPAQUE_ALPHA) continue;

    opaque++;
    const luminance = 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
    if (luminance > LIGHT_LUMINANCE) light++;
    else if (luminance < DARK_LUMINANCE) dark++;
  }

  if (opaque < info.width * info.height * MIN_OPAQUE_SHARE) return null;

  const lightShare = light / opaque;
  const darkShare = dark / opaque;

  // A mixed logo loses something either way; the tile protects whichever ink there is more of.
  if (lightShare >= MIN_SHARE && lightShare > darkShare) return 'light';
  if (darkShare >= MIN_SHARE && darkShare > lightShare) return 'dark';
  return null;
}

export async function fetchLogoTone(url: string): Promise<LogoTone | null> {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) });
    if (!response.ok) throw new Error(`HTTP ${response.status} ${response.statusText}`);

    const type = response.headers.get('content-type') ?? '';
    if (!type.startsWith('image/')) throw new Error(`unexpected content-type ${type}`);

    const bytes = await response.arrayBuffer();
    if (bytes.byteLength > MAX_BYTES) throw new Error(`${bytes.byteLength} bytes exceeds the ${MAX_BYTES} byte cap`);

    return await classifyLogoTone(Buffer.from(bytes));
  } catch (error) {
    console.warn(`Could not classify sponsor logo ${url}, rendering it untouched: ${error}`);
    return null;
  }
}
