<script setup lang="ts">
import { faCheck, faMinus, faXmark } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
import { computed } from 'vue';
import { featureCategories } from '../data/features.ts';

const props = defineProps<{ id: string }>();

const category = computed(() => featureCategories.find((c) => c.id === props.id));

function icon(value: boolean | null) {
  if (value === true) return { icon: faCheck, cls: 'feature-yes' };
  if (value === false) return { icon: faXmark, cls: 'feature-no' };
  return { icon: faMinus, cls: 'feature-unknown' };
}
</script>

<template>
  <div v-if="category" class="feature-category">
    <p v-if="category.description" class="feature-category-description">{{ category.description }}</p>

    <div v-if="category.rows?.length" class="feature-table-scroll">
      <table class="feature-table">
        <thead>
          <tr>
            <th class="feature-col-name">Feature</th>
            <th>Calagopus</th>
            <th>Pterodactyl</th>
            <th>Pelican</th>
            <th>AMP</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in category.rows" :key="row.name">
            <td class="feature-col-name">{{ row.name }}</td>
            <td>
              <FontAwesomeIcon :icon="icon(row.calagopus).icon" :class="icon(row.calagopus).cls" />
            </td>
            <td>
              <FontAwesomeIcon :icon="icon(row.pterodactyl).icon" :class="icon(row.pterodactyl).cls" />
            </td>
            <td>
              <FontAwesomeIcon :icon="icon(row.pelican).icon" :class="icon(row.pelican).cls" />
            </td>
            <td>
              <FontAwesomeIcon :icon="icon(row.amp).icon" :class="icon(row.amp).cls" />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <p v-if="category.rows?.length" class="feature-legend">
      <FontAwesomeIcon :icon="faMinus" class="feature-unknown" /> = not independently verified for that product
    </p>

    <ul v-if="category.bullets?.length" class="feature-bullets">
      <li v-for="b in category.bullets" :key="b.name">
        <FontAwesomeIcon :icon="faCheck" class="feature-yes feature-bullet-icon" />
        <span><strong>{{ b.name }}</strong> - {{ b.description }}</span>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.feature-category {
  margin: 24px 0 40px;
}

.feature-category-description {
  color: var(--vp-c-text-2);
}

.feature-table-scroll {
  overflow-x: auto;
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
}

.feature-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
  display: table;
}

.feature-table thead th {
  position: sticky;
  top: 0;
  background-color: var(--vp-c-bg-soft);
  color: var(--vp-c-text-1);
  font-weight: 600;
  text-align: center;
  padding: 10px 12px;
  border-bottom: 1px solid var(--vp-c-divider);
  white-space: nowrap;
}

.feature-table thead th.feature-col-name,
.feature-table td.feature-col-name {
  text-align: left;
}

.feature-table tbody td {
  text-align: center;
  padding: 10px 12px;
  border-bottom: 1px solid var(--vp-c-divider);
}

.feature-table tbody tr:last-child td {
  border-bottom: none;
}

.feature-table tbody tr:hover {
  background-color: var(--vp-c-bg-soft);
}

.feature-table td.feature-col-name {
  font-weight: 500;
  color: var(--vp-c-text-1);
  white-space: nowrap;
}

.feature-yes {
  color: var(--mantine-color-green-6);
}

.feature-no {
  color: var(--mantine-color-red-6);
}

.feature-unknown {
  color: var(--vp-c-text-3);
}

.feature-legend {
  margin: 8px 0 0;
  font-size: 12px;
  color: var(--vp-c-text-3);
}

.feature-bullets {
  list-style: none;
  margin: 16px 0 0;
  padding: 0;
  display: grid;
  gap: 10px;
}

@media (min-width: 768px) {
  .feature-bullets {
    grid-template-columns: repeat(2, 1fr);
    column-gap: 24px;
  }
}

.feature-bullets li {
  display: flex;
  align-items: baseline;
  gap: 10px;
  line-height: 22px;
  color: var(--vp-c-text-2);
}

.feature-bullet-icon {
  flex-shrink: 0;
  font-size: 12px;
  transform: translateY(-1px);
}

.feature-bullets strong {
  color: var(--vp-c-text-1);
}
</style>
