<script setup lang="ts">
const { color = 'blue' } = defineProps<{
  title?: string;
  color?: string;
}>();
</script>

<template>
  <div
    class="m-alert"
    role="alert"
    :style="{
      '--alert-bg': `var(--mantine-color-${color}-light)`,
      '--alert-color': `var(--mantine-color-${color}-light-color)`,
    }"
  >
    <div v-if="title" class="title">{{ title }}</div>
    <div class="message"><slot /></div>
  </div>
</template>

<style scoped>
:where(.m-alert) {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: var(--mantine-spacing-xs);
  padding: var(--mantine-spacing-md);
  overflow: hidden;
  border: 1px solid transparent;
  border-radius: var(--mantine-radius-default);
  background-color: var(--alert-bg);
}

.title {
  font-size: var(--mantine-font-size-sm);
  font-weight: var(--mantine-font-weight-bold);
  color: var(--alert-color);
}

.message {
  font-size: var(--mantine-font-size-sm);
  line-height: var(--mantine-line-height);
  color: var(--mantine-color-black);
}

.dark .message {
  color: var(--mantine-color-white);
}
</style>
