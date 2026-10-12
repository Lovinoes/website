<script setup lang="ts" generic="T extends string | number">
type MantineSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

const { size = 'sm' } = defineProps<{
  data: readonly (T | { value: T; label: string })[];
  size?: MantineSize;
  fullWidth?: boolean;
}>();

const value = defineModel<T>({ required: true });

const item = (entry: T | { value: T; label: string }) =>
  typeof entry === 'object' ? entry : { value: entry, label: String(entry) };
</script>

<template>
  <div
    class="m-segmented"
    role="group"
    :data-full-width="fullWidth ? '' : undefined"
    :style="{ '--sc-padding': `var(--sc-padding-${size})`, '--sc-font-size': `var(--mantine-font-size-${size})` }"
  >
    <button
      v-for="entry in data"
      :key="item(entry).value"
      type="button"
      class="control"
      :data-active="value === item(entry).value ? '' : undefined"
      :aria-pressed="value === item(entry).value"
      @click="value = item(entry).value"
    >
      {{ item(entry).label }}
    </button>
  </div>
</template>

<style scoped>
:where(.m-segmented) {
  --sc-padding-xs: 2px 6px;
  --sc-padding-sm: 3px 10px;
  --sc-padding-md: 4px 14px;
  --sc-padding-lg: 7px 16px;
  --sc-padding-xl: 10px 20px;

  display: inline-flex;
  flex-wrap: wrap;
  max-width: 100%;
  padding: 4px;
  border-radius: var(--mantine-radius-default);
  background-color: var(--mantine-color-gray-1);
}

:where(.dark .m-segmented) {
  background-color: var(--mantine-color-dark-8);
}

:where(.m-segmented[data-full-width]) {
  display: flex;
}

.control {
  --separator-color: var(--mantine-color-gray-3);

  position: relative;
  flex: 1 1 auto;
  padding: var(--sc-padding);
  border-radius: calc(var(--mantine-radius-default) - 4px);
  font-size: var(--sc-font-size);
  font-weight: var(--mantine-font-weight-medium);
  line-height: var(--mantine-line-height);
  color: var(--mantine-color-gray-7);
  text-align: center;
  white-space: nowrap;
  cursor: pointer;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
  transition:
    color 200ms ease,
    background-color 200ms ease;
}

.dark .control {
  --separator-color: var(--mantine-color-dark-4);

  color: var(--mantine-color-dark-1);
}

.control::before {
  content: '';
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  width: 1px;
  background-color: var(--separator-color);
  transition: background-color 200ms ease;
}

.control:first-child::before,
.control[data-active]::before,
.control[data-active] + .control::before {
  background-color: transparent;
}

.control[data-active] {
  background-color: var(--mantine-color-white);
  box-shadow: var(--mantine-shadow-xs);
  color: var(--mantine-color-black);
}

.dark .control[data-active] {
  background-color: var(--mantine-color-dark-5);
  box-shadow: none;
  color: var(--mantine-color-white);
}

@media (hover: hover) {
  .control:not([data-active]):hover {
    color: var(--mantine-color-black);
  }

  .dark .control:not([data-active]):hover {
    color: var(--mantine-color-white);
  }
}

.control:focus-visible {
  outline: 2px solid var(--mantine-primary-color-filled);
  outline-offset: -2px;
}

@media (max-width: 640px) {
  .control {
    white-space: normal;
  }
}
</style>
