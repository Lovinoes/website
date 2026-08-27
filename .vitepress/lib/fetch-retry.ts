const RETRIES = 3;

export async function fetchJson<T>(
  url: string,
  describe: string,
  offlineFlag: string,
  headers: Record<string, string> = {},
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= RETRIES; attempt++) {
    try {
      const response = await fetch(url, { headers: { accept: 'application/json', ...headers } });
      if (!response.ok) throw new Error(`HTTP ${response.status} ${response.statusText}`);
      return (await response.json()) as T;
    } catch (error) {
      lastError = error;
      if (attempt < RETRIES) await new Promise((resolve) => setTimeout(resolve, 500 * attempt));
    }
  }

  throw new Error(`Could not load ${describe} from ${url}: ${lastError}. Set ${offlineFlag}=1 to build without them.`);
}
