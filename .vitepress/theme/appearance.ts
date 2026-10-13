import { nextTick, type Ref } from 'vue';

const DURATION_MS = 500;

export function createAppearanceToggle(isDark: Ref<boolean>): (event: MouseEvent) => void {
  return (event) => {
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (!document.startViewTransition || reduceMotion) {
      isDark.value = !isDark.value;
      return;
    }

    let x = event.clientX;
    let y = event.clientY;

    if (event.detail === 0 && event.currentTarget instanceof Element) {
      const rect = event.currentTarget.getBoundingClientRect();
      x = rect.left + rect.width / 2;
      y = rect.top + rect.height / 2;
    }

    const endRadius = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y));

    const transition = document.startViewTransition(async () => {
      isDark.value = !isDark.value;
      await nextTick();
    });

    transition.ready.then(() => {
      document.documentElement.animate(
        { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${endRadius}px at ${x}px ${y}px)`] },
        { duration: DURATION_MS, easing: 'ease-in-out', pseudoElement: '::view-transition-new(root)' },
      );
    });
  };
}
