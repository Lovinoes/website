<script setup lang="ts">
import Card from './Card.vue';

defineProps<{ title: string }>();
</script>

<template>
  <Card :padding="0">
    <div class="header">
      <div v-if="$slots.icon" class="icon">
        <slot name="icon" />
      </div>
      <h5 class="title">{{ title }}</h5>
      <slot name="right" />
    </div>
    <div class="body">
      <slot />
    </div>
  </Card>
</template>

<style scoped>
.header {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--mantine-spacing-sm);
  padding: var(--mantine-spacing-sm) var(--mantine-spacing-md);
  border-bottom: 1px solid var(--mantine-color-default-border);
  background-color: var(--mantine-color-gray-0);
}

.dark .header {
  background-color: var(--mantine-color-default);
}

.icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 6px;
  background-color: var(--mantine-color-gray-2);
}

.dark .icon {
  background-color: var(--mantine-color-default-hover);
}

.title {
  margin: 0;
  padding: 0;
  border: none;
  font-size: var(--mantine-h5-font-size);
  font-weight: 600;
  line-height: var(--mantine-h5-line-height);
  color: var(--mantine-color-text);
}

.body {
  height: 100%;
  padding: var(--mantine-spacing-md);
}
</style>
