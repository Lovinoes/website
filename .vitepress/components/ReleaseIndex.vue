<script setup lang="ts">
import { computed } from 'vue';
import { data as releases } from '../data/releases.data.mts';
import { formatDate } from '../lib/format.ts';

const projects = computed(() => Object.values(releases));
</script>

<template>
  <div class="release-index">
    <a v-for="project in projects" :key="project.key" class="card" :href="project.link">
      <span class="card-title">{{ project.title }}</span>
      <span class="card-version">{{ project.latestVersion || 'unavailable' }}</span>
      <span v-if="project.releases[0]" class="card-date">
        released {{ formatDate(project.releases[0].publishedAt) }}
      </span>
      <span class="card-blurb">{{ project.blurb }}</span>
      <span v-if="project.total" class="card-total">{{ project.total }} releases</span>
    </a>
  </div>
</template>

<style scoped>
.release-index {
  display: grid;
  gap: 16px;
  grid-template-columns: 1fr;
  margin: 24px 0;
}

@media (min-width: 640px) {
  .release-index {
    grid-template-columns: repeat(3, 1fr);
  }
}

.card {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 20px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  background-color: var(--vp-c-bg-soft);
  font-weight: 400;
  text-decoration: none;
  transition: border-color 0.25s;
}

.card:hover {
  border-color: var(--vp-c-brand-1);
}

.card-title {
  font-size: 13px;
  font-weight: 500;
  color: var(--vp-c-text-2);
}

.card-version {
  font-size: 28px;
  font-weight: 700;
  line-height: 1.2;
  color: var(--vp-c-brand-1);
}

.card-date,
.card-total {
  font-size: 13px;
  color: var(--vp-c-text-2);
}

.card-blurb {
  margin-top: 8px;
  font-size: 14px;
  color: var(--vp-c-text-1);
}
</style>
