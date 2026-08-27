<script setup lang="ts">
import { useData } from 'vitepress';
import VPSocialLink from 'vitepress/dist/client/theme-default/components/VPSocialLink.vue';
import { computed } from 'vue';
import { data as github } from '../data/github-stars.data.mts';
import { formatCount } from '../lib/format.ts';

const { theme } = useData();

const links = computed(() => theme.value.socialLinks ?? []);
const stars = computed(() => (github.stars === null ? null : formatCount(github.stars)));
const starsLabel = computed(() =>
  stars.value === null ? `${github.repo} on GitHub` : `${github.repo} on GitHub, ${stars.value} stars`,
);
</script>

<template>
  <ul v-if="links.length" class="VPNavBarSocialLinks">
    <li v-for="link in links" :key="link.link" class="item">
      <a
        v-if="link.icon === 'github'"
        class="VPSocialLink GitHubStars no-icon"
        :href="github.link"
        target="_blank"
        rel="me noopener"
        :aria-label="starsLabel"
      >
        <svg class="stars-icon" viewBox="0 0 24 24" aria-hidden="true">
          <path
            fill="currentColor"
            d="M12 .297c-6.63 0-12 5.373-12 12c0 5.303 3.438 9.8 8.205 11.385c.6.113.82-.258.82-.577c0-.285-.01-1.04-.015-2.04c-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729c1.205.084 1.838 1.236 1.838 1.236c1.07 1.835 2.809 1.305 3.495.998c.108-.776.417-1.305.76-1.605c-2.665-.3-5.466-1.332-5.466-5.93c0-1.31.465-2.38 1.235-3.22c-.135-.303-.54-1.523.105-3.176c0 0 1.005-.322 3.3 1.23c.96-.267 1.98-.399 3-.405c1.02.006 2.04.138 3 .405c2.28-1.552 3.285-1.23 3.285-1.23c.645 1.653.24 2.873.12 3.176c.765.84 1.23 1.91 1.23 3.22c0 4.61-2.805 5.625-5.475 5.92c.42.36.81 1.096.81 2.22c0 1.606-.015 2.896-.015 3.286c0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"
          />
        </svg>
        <span v-if="stars" class="stars-count">{{ stars }}</span>
      </a>
      <VPSocialLink v-else :icon="link.icon" :link="link.link" :ariaLabel="link.ariaLabel" :target="link.target" me />
    </li>
  </ul>
</template>

<style scoped>
.VPNavBarSocialLinks {
  display: none;
}

@media (min-width: 1280px) {
  .VPNavBarSocialLinks {
    display: flex;
    align-items: center;
  }
}

.VPSocialLink {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 36px;
  height: 36px;
  color: var(--vp-c-text-2);
  transition: color 0.5s;
}

.VPSocialLink:hover {
  color: var(--vp-c-text-1);
  transition: color 0.25s;
}

.GitHubStars {
  gap: 6px;
  width: auto;
  padding: 0 8px;
}

.stars-icon {
  width: 20px;
  height: 20px;
  flex: none;
}

.stars-count {
  font-size: 13px;
  font-weight: 600;
  line-height: 1;
  font-variant-numeric: tabular-nums;
}
</style>
