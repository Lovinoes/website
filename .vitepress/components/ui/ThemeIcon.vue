<script setup lang="ts">
type MantineSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

const {
  size = 'md',
  color = 'blue',
  variant = 'filled',
  radius = 'md',
} = defineProps<{
  size?: MantineSize;
  color?: string;
  variant?: 'filled' | 'light' | 'default';
  radius?: MantineSize;
}>();
</script>

<template>
  <div
    class="m-theme-icon"
    :data-variant="variant"
    :style="{
      '--ti-size': `var(--ti-size-${size})`,
      '--ti-radius': `var(--mantine-radius-${radius})`,
      '--ti-filled': `var(--mantine-color-${color}-filled)`,
      '--ti-light': `var(--mantine-color-${color}-light)`,
      '--ti-light-color': `var(--mantine-color-${color}-light-color)`,
    }"
  >
    <slot />
  </div>
</template>

<style scoped>
:where(.m-theme-icon) {
  --ti-size-xs: 18px;
  --ti-size-sm: 22px;
  --ti-size-md: 28px;
  --ti-size-lg: 34px;
  --ti-size-xl: 44px;

  display: inline-flex;
  flex-shrink: 0;
  align-items: center;
  justify-content: center;
  width: var(--ti-size);
  height: var(--ti-size);
  border: 1px solid transparent;
  border-radius: var(--ti-radius);
  line-height: 1;
  user-select: none;
  background: var(--ti-filled);
  color: var(--mantine-color-white);
}

:where(.m-theme-icon[data-variant='light']) {
  background: var(--ti-light);
  color: var(--ti-light-color);
}

:where(.m-theme-icon[data-variant='default']) {
  border-color: var(--mantine-color-default-border);
  background: var(--mantine-color-default);
  color: var(--mantine-color-default-color);
}
</style>
