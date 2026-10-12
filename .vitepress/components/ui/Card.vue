<script setup lang="ts">
type MantineSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

const { component = 'div', padding = 'md' } = defineProps<{
  component?: string;
  href?: string;
  hoverable?: boolean;
  padding?: MantineSize | 0;
}>();
</script>

<template>
  <component
    :is="href ? 'a' : component"
    :href
    class="m-card"
    :data-hoverable="hoverable || href ? '' : undefined"
    :style="{ '--card-padding': padding === 0 ? '0' : `var(--mantine-spacing-${padding})` }"
  >
    <slot />
  </component>
</template>

<style scoped>
:where(.m-card) {
  --card-bg: var(--mantine-color-white);
  --card-hover-bg: color-mix(in srgb, var(--mantine-color-black) 3%, var(--card-bg));

  position: relative;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  padding: var(--card-padding);
  border: 1px solid var(--mantine-color-gray-3);
  border-radius: var(--mantine-radius-md);
  background-color: var(--card-bg);
}

:where(.dark .m-card) {
  --card-bg: var(--mantine-color-dark-6);
  --card-hover-bg: color-mix(in srgb, var(--mantine-color-white) 2%, var(--card-bg));

  border-color: var(--mantine-color-dark-4);
}

:where(.m-card[data-hoverable]) {
  cursor: pointer;
  transition: background-color 190ms;
}

:where(.m-card[data-hoverable]:hover) {
  background-color: var(--card-hover-bg);
}

.m-card,
.m-card:hover {
  color: var(--mantine-color-text);
  font-weight: var(--mantine-font-weight-regular);
  text-decoration: none;
}
</style>
