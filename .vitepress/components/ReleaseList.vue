<script setup lang="ts">
import { faSearch } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { computed, onMounted, ref } from 'vue';
import { data as releases } from '../data/releases.data.mts';
import { formatCount, formatDate, formatMebibytes as formatSize } from '../lib/format.ts';
import Badge from './ui/Badge.vue';
import Card from './ui/Card.vue';
import Checkbox from './ui/Checkbox.vue';
import CollapsibleSection from './ui/CollapsibleSection.vue';

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
    <Card v-if="project.total > 0" class="summary" padding="lg">
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
    </Card>

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
        <div class="filter">
          <span class="filter-icon" aria-hidden="true"><FontAwesomeIcon :icon="faSearch" /></span>
          <input
            v-model="query"
            type="search"
            class="filter-input"
            :placeholder="`Filter ${formatCount(project.releases.length)} releases`"
            aria-label="Filter releases"
          />
        </div>
        <Checkbox v-if="withoutNotes > 0" v-model="notesOnly">
          Hide the {{ formatCount(withoutNotes) }} release{{ withoutNotes === 1 ? '' : 's' }} without notes
        </Checkbox>
      </div>

      <p v-if="visible.length === 0" class="empty">No release matches “{{ query }}”.</p>

      <article v-for="release in visible" :key="release.tag" class="release">
        <div class="release-head">
          <h2 :id="release.anchor">
            {{ release.version }}
            <a class="header-anchor" :href="`#${release.anchor}`" :aria-label="`Permalink to ${release.version}`"></a>
          </h2>
          <time :datetime="release.publishedAt">{{ formatDate(release.publishedAt) }}</time>
          <Badge v-if="release.version === project.latestVersion" variant="light">Latest</Badge>
          <Badge v-if="release.prerelease" variant="light" color="yellow">Pre-release</Badge>
        </div>

        <!-- eslint-disable-next-line vue/no-v-html -- rendered at build time from the release API -->
        <div v-if="release.hasNotes" class="release-body" v-html="release.html" />
        <p v-else class="release-body no-notes">No release notes were published for this version.</p>

        <CollapsibleSection v-if="release.assets.length" :title="`${release.assets.length} assets`">
          <div class="m-table" data-flush>
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
          </div>
        </CollapsibleSection>

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
  flex-direction: row;
  flex-wrap: wrap;
  gap: 16px;
  align-items: flex-end;
  justify-content: space-between;
  margin: 24px 0;
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
  position: relative;
  flex: 1 1 240px;
}

.filter-icon {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 1px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  color: var(--mantine-color-dimmed);
  pointer-events: none;
}

.filter-input {
  width: 100%;
  height: 36px;
  padding: 0 12px 0 34px;
  font-size: var(--mantine-font-size-sm);
  color: var(--mantine-color-text);
  border: 1px solid var(--mantine-color-default-border);
  border-radius: var(--mantine-radius-default);
  background-color: var(--mantine-color-default);
  transition: border-color 100ms ease;
}

.filter-input::placeholder {
  color: var(--mantine-color-placeholder);
}

.filter-input:focus {
  border-color: var(--mantine-primary-color-filled);
  outline: none;
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

.no-notes {
  color: var(--vp-c-text-2);
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
