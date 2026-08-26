<script setup lang="ts">
import { useData } from 'vitepress';
import { computed } from 'vue';
import { formatDate } from '../lib/format.ts';

const { theme, page } = useData();

const date = computed(() => new Date(page.value.lastUpdated!));
const isoDatetime = computed(() => date.value.toISOString());
const datetime = computed(() => formatDate(date.value));
</script>

<template>
  <p class="VPLastUpdated">
    {{ theme.lastUpdated?.text || theme.lastUpdatedText || 'Last updated' }}:
    <time :datetime="isoDatetime">{{ datetime }}</time>
  </p>
</template>

<style scoped>
.VPLastUpdated {
  line-height: 24px;
  font-size: 14px;
  font-weight: 500;
  color: var(--vp-c-text-2);
}

@media (min-width: 640px) {
  .VPLastUpdated {
    line-height: 32px;
    font-size: 14px;
    font-weight: 500;
  }
}
</style>
