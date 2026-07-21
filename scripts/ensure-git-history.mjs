import { execSync } from 'node:child_process';

try {
  const shallow = execSync('git rev-parse --is-shallow-repository', { stdio: ['ignore', 'pipe', 'ignore'] })
    .toString()
    .trim();
  if (shallow === 'true') {
    console.log('[ensure-git-history] shallow clone detected, fetching full history...');
    execSync('git fetch --quiet --unshallow', { stdio: 'inherit' });
    console.log('[ensure-git-history] done');
  }
} catch (err) {
  console.warn(`[ensure-git-history] skied ${err.message.split('\n')[0]}`);
}
