<script setup lang="ts">
type MantineSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

const { size = 'sm', color = 'blue' } = defineProps<{
  size?: MantineSize;
  color?: string;
}>();

const checked = defineModel<boolean>();
</script>

<template>
  <label
    class="m-checkbox"
    :style="{
      '--checkbox-size': `var(--checkbox-size-${size})`,
      '--label-lh': `var(--checkbox-size-${size})`,
      '--checkbox-color': `var(--mantine-color-${color}-filled)`,
    }"
  >
    <span class="inner">
      <input v-model="checked" type="checkbox" class="input" />
      <svg class="icon" viewBox="0 0 10 7" fill="none" aria-hidden="true">
        <path
          d="M4 4.586L1.707 2.293A1 1 0 1 0 .293 3.707l3 3a.997.997 0 0 0 1.414 0l5-5A1 1 0 1 0 8.293.293L4 4.586z"
          fill="currentColor"
          fill-rule="evenodd"
          clip-rule="evenodd"
        />
      </svg>
    </span>
    <span v-if="$slots.default" class="label"><slot /></span>
  </label>
</template>

<style scoped>
:where(.m-checkbox) {
  --checkbox-size-xs: 16px;
  --checkbox-size-sm: 20px;
  --checkbox-size-md: 24px;
  --checkbox-size-lg: 30px;
  --checkbox-size-xl: 36px;

  display: inline-flex;
  align-items: flex-start;
  font-size: var(--mantine-font-size-sm);
  line-height: var(--label-lh);
  color: var(--mantine-color-text);
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}

.inner {
  position: relative;
  flex-shrink: 0;
  width: var(--checkbox-size);
  height: var(--checkbox-size);
}

.input {
  appearance: none;
  display: block;
  width: var(--checkbox-size);
  height: var(--checkbox-size);
  margin: 0;
  padding: 0;
  border: 1px solid var(--mantine-color-gray-4);
  border-radius: var(--mantine-radius-default);
  background-color: var(--mantine-color-white);
  cursor: pointer;
  transition:
    border-color 100ms ease,
    background-color 100ms ease;
}

.dark .input {
  border-color: var(--mantine-color-dark-4);
  background-color: var(--mantine-color-dark-6);
}

.input:checked {
  border-color: var(--checkbox-color);
  background-color: var(--checkbox-color);
}

.input:focus-visible {
  outline: 2px solid var(--mantine-primary-color-filled);
  outline-offset: 2px;
}

.icon {
  position: absolute;
  inset: 0;
  width: 60%;
  margin: auto;
  color: var(--mantine-color-white);
  pointer-events: none;
  opacity: 0;
  transform: translateY(5px) scale(0.5);
  transition:
    transform 100ms ease,
    opacity 100ms ease;
}

.input:checked + .icon {
  opacity: 1;
  transform: none;
}

.label {
  padding-inline-start: var(--mantine-spacing-sm);
}
</style>
