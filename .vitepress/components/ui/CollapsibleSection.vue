<script setup lang="ts">
defineProps<{ title?: string }>();

const open = defineModel<boolean>('open', { default: false });
</script>

<template>
  <details class="m-collapsible" :open @toggle="open = ($event.target as HTMLDetailsElement).open">
    <summary>
      <span v-if="$slots.icon" class="m-collapsible-icon"><slot name="icon" /></span>
      <slot name="title">{{ title }}</slot>
    </summary>
    <div class="m-collapsible-body">
      <slot />
    </div>
  </details>
</template>
