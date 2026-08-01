<script setup lang="ts">
import { computed, onMounted, ref } from 'vue';
import { data as releases } from '../data/releases.data.mts';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const props = defineProps<{ project: string }>();

const project = computed(() => releases[props.project]);
const query = ref('');
const notesOnly = ref(true);
const newerVersion = ref('');

const withoutNotes = computed(() => project.value.releases.length - project.value.withNotes);

const visible = computed(() => {
  const term = query.value.trim().toLowerCase();

  return project.value.releases.filter((release) => {
    if (notesOnly.value && !release.hasNotes) return false;
    if (!term) return true;
    return release.version.toLowerCase().includes(term) || release.html.toLowerCase().includes(term);
  });
});

function formatDate(value: string): string {
  const date = new Date(value);
  return `${MONTHS[date.getUTCMonth()]} ${date.getUTCDate()}, ${date.getUTCFullYear()}`;
}

function formatSize(bytes: number): string {
  const mib = bytes / 1024 / 1024;
  return mib >= 10 ? `${Math.round(mib)} MiB` : `${mib.toFixed(1)} MiB`;
}

const formatCount = (value: number): string => value.toLocaleString('en-US');

// The page ships the releases known at build time; this only flags a newer one.
onMounted(async () => {
  const live = await fetch('https://calagopus.com/api/releases', { headers: { accept: 'application/json' } })
    .then((response) => (response.ok ? response.json() : null))
    .catch(() => null);

  const latest = live?.projects?.find((entry: { project: string }) => entry.project === props.project);
  if (latest && latest.latest_version !== project.value.latestVersion) newerVersion.value = latest.latest_version;
});
</script>

<template>
  <div class="releases">
    <div v-if="project.total > 0" class="summary">
      <div class="summary-latest">
        <span class="summary-label">Latest release</span>
        <a class="summary-version" :href="`#${project.releases[0]?.anchor}`">{{ project.latestVersion }}</a>
        <span v-if="project.releases[0]" class="summary-date">{{ formatDate(project.releases[0].publishedAt) }}</span>
      </div>
      <div class="summary-meta">
        <a :href="`https://github.com/${project.repo}/releases`" target="_blank" rel="noreferrer">
          {{ formatCount(project.total) }} releases on GitHub
        </a>
        <span v-if="project.updatedAt">Synced {{ formatDate(project.updatedAt) }}</span>
      </div>
    </div>

    <div v-if="newerVersion" class="tip custom-block">
      <p class="custom-block-title">{{ newerVersion }} is out</p>
      <p>
        It was published after this page was built.
        <a :href="`https://github.com/${project.repo}/releases/latest`" target="_blank" rel="noreferrer">
          Read the notes on GitHub
        </a>
        while the page catches up.
      </p>
    </div>

    <div v-if="project.total === 0" class="warning custom-block">
      <p class="custom-block-title">Releases unavailable</p>
      <p>
        This page was built without the release API. See
        <a :href="`https://github.com/${project.repo}/releases`" target="_blank" rel="noreferrer">GitHub releases</a>
        instead.
      </p>
    </div>

    <template v-else>
      <div class="controls">
        <input
          v-model="query"
          type="search"
          class="filter"
          :placeholder="`Filter ${formatCount(project.releases.length)} releases`"
          aria-label="Filter releases"
        />
        <label v-if="withoutNotes > 0" class="toggle">
          <input v-model="notesOnly" type="checkbox" />
          Hide the {{ formatCount(withoutNotes) }} release{{ withoutNotes === 1 ? '' : 's' }} without notes
        </label>
      </div>

      <p v-if="visible.length === 0" class="empty">No release matches “{{ query }}”.</p>

      <article v-for="release in visible" :key="release.tag" class="release">
        <div class="release-head">
          <h2 :id="release.anchor">
            {{ release.version }}
            <a class="header-anchor" :href="`#${release.anchor}`" :aria-label="`Permalink to ${release.version}`"></a>
          </h2>
          <time :datetime="release.publishedAt">{{ formatDate(release.publishedAt) }}</time>
          <span v-if="release.version === project.latestVersion" class="badge latest">Latest</span>
          <span v-if="release.prerelease" class="badge pre">Pre-release</span>
        </div>

        <!-- eslint-disable-next-line vue/no-v-html -- rendered at build time from the release API -->
        <div v-if="release.hasNotes" class="release-body" v-html="release.html" />
        <p v-else class="release-body no-notes">No release notes were published for this version.</p>

        <details v-if="release.assets.length" class="assets">
          <summary>{{ release.assets.length }} assets</summary>
          <table>
            <thead>
              <tr>
                <th>Asset</th>
                <th>Size</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="asset in release.assets" :key="asset.name">
                <td><a :href="asset.url" target="_blank" rel="noreferrer">{{ asset.name }}</a></td>
                <td>{{ formatSize(asset.size) }}</td>
              </tr>
            </tbody>
          </table>
        </details>

        <p class="release-links">
          <a :href="release.htmlUrl" target="_blank" rel="noreferrer">View release on GitHub</a>
          <a v-if="release.compareUrl" :href="release.compareUrl" target="_blank" rel="noreferrer">Full changelog</a>
        </p>
      </article>
    </template>
  </div>
</template>

<style scoped>
.summary {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  align-items: flex-end;
  justify-content: space-between;
  padding: 20px 24px;
  margin: 24px 0;
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  background-color: var(--vp-c-bg-soft);
}

.summary-label {
  display: block;
  font-size: 13px;
  font-weight: 500;
  color: var(--vp-c-text-2);
}

.summary-version {
  font-size: 32px;
  font-weight: 700;
  line-height: 1.2;
  color: var(--vp-c-brand-1);
  text-decoration: none;
}

.summary-date {
  margin-left: 8px;
  font-size: 14px;
  color: var(--vp-c-text-2);
}

.summary-meta {
  display: flex;
  flex-direction: column;
  gap: 4px;
  font-size: 13px;
  text-align: right;
  color: var(--vp-c-text-2);
}

.controls {
  display: flex;
  flex-wrap: wrap;
  gap: 12px 20px;
  align-items: center;
  margin: 24px 0;
}

.filter {
  flex: 1 1 240px;
  padding: 8px 12px;
  font-size: 14px;
  color: var(--vp-c-text-1);
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  background-color: var(--vp-c-bg);
  transition: border-color 0.25s;
}

.filter:focus {
  border-color: var(--vp-c-brand-1);
  outline: none;
}

.toggle {
  display: flex;
  gap: 8px;
  align-items: center;
  font-size: 14px;
  color: var(--vp-c-text-2);
  cursor: pointer;
}

.empty {
  color: var(--vp-c-text-2);
}

.release {
  padding-top: 24px;
  border-top: 1px solid var(--vp-c-divider);
}

.release-head {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 12px;
  align-items: baseline;
}

.release-head h2 {
  margin: 0;
  border-top: none;
  padding-top: 0;
}

/* The theme offsets the anchor to clear a heading's `padding-top`, which is gone here. */
.release-head h2 .header-anchor {
  top: 0;
}

.release-head time {
  font-size: 14px;
  color: var(--vp-c-text-2);
}

/* The theme makes `--vp-c-brand-soft` a solid color in dark mode, so these outline
   rather than fill - a tinted background would drop the label's contrast. */
.badge {
  padding: 1px 8px;
  font-size: 12px;
  font-weight: 600;
  line-height: 18px;
  border: 1px solid;
  border-radius: 999px;
}

.badge.latest {
  color: var(--vp-c-brand-1);
}

.badge.pre {
  color: var(--vp-c-warning-1);
}

.no-notes {
  color: var(--vp-c-text-2);
}

.assets summary {
  font-size: 14px;
  font-weight: 500;
  color: var(--vp-c-text-2);
  cursor: pointer;
}

.assets table {
  margin-top: 12px;
  font-size: 14px;
}

.release-links {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  font-size: 14px;
}

@media (max-width: 640px) {
  .summary-meta {
    text-align: left;
  }
}
</style>
