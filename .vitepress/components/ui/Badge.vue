<script setup lang="ts">
type MantineSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

const {
  component = 'span',
  size = 'md',
  color = 'blue',
  variant = 'filled',
  dotColor,
} = defineProps<{
  component?: string;
  size?: MantineSize;
  color?: string;
  variant?: 'filled' | 'light' | 'outline' | 'dot';
  dotColor?: string;
}>();
</script>

<template>
  <component
    :is="component"
    class="m-badge"
    :data-variant="variant"
    :style="{
      '--badge-height': `var(--badge-height-${size})`,
      '--badge-fz': `var(--badge-fz-${size})`,
      '--badge-padding-x': `var(--badge-padding-x-${size})`,
      '--badge-filled': `var(--mantine-color-${color}-filled)`,
      '--badge-light': `var(--mantine-color-${color}-light)`,
      '--badge-light-color': `var(--mantine-color-${color}-light-color)`,
      '--badge-outline': `var(--mantine-color-${color}-outline)`,
      '--badge-dot-color': dotColor ?? `var(--mantine-color-${color}-filled)`,
    }"
  >
    <slot />
  </component>
</template>

<style scoped>
:where(.m-badge) {
  --badge-height-xs: 16px;
  --badge-height-sm: 18px;
  --badge-height-md: 20px;
  --badge-height-lg: 26px;
  --badge-height-xl: 32px;
  --badge-fz-xs: 9px;
  --badge-fz-sm: 10px;
  --badge-fz-md: 11px;
  --badge-fz-lg: 13px;
  --badge-fz-xl: 16px;
  --badge-padding-x-xs: 6px;
  --badge-padding-x-sm: 8px;
  --badge-padding-x-md: 10px;
  --badge-padding-x-lg: 12px;
  --badge-padding-x-xl: 16px;

  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  gap: calc(var(--mantine-spacing-xs) / 2);
  width: fit-content;
  height: var(--badge-height);
  padding: 0 var(--badge-padding-x);
  overflow: hidden;
  border: 1px solid transparent;
  border-radius: 1000px;
  background: var(--badge-filled);
  color: var(--mantine-color-white);
  font-size: var(--badge-fz);
  font-weight: var(--mantine-font-weight-medium);
  line-height: calc(var(--badge-height) - 2px);
  letter-spacing: 0.25px;
  text-transform: uppercase;
  white-space: nowrap;
}

:where(.m-badge[data-variant='light']) {
  background: var(--badge-light);
  color: var(--badge-light-color);
}

:where(.m-badge[data-variant='outline']) {
  border-color: var(--badge-outline);
  background: transparent;
  color: var(--badge-outline);
}
:where(.m-badge[data-variant='dot']) {
  --badge-dot-size: calc(var(--badge-height) / 3.4);

  border-color: var(--mantine-color-gray-4);
  background: var(--mantine-color-white);
  color: var(--mantine-color-black);
}

:where(.dark .m-badge[data-variant='dot']) {
  border-color: var(--mantine-color-dark-5);
  background: var(--mantine-color-dark-5);
  color: var(--mantine-color-white);
}

.m-badge[data-variant='dot']::before {
  content: '';
  flex-shrink: 0;
  width: var(--badge-dot-size);
  height: var(--badge-dot-size);
  margin-inline-end: calc(var(--badge-dot-size) - var(--mantine-spacing-xs) / 2);
  border-radius: 50%;
  background-color: var(--badge-dot-color);
}

button.m-badge {
  cursor: pointer;
}
</style>
