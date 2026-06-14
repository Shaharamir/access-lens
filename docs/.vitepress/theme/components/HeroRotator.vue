<script setup lang="ts">
import { onMounted, onUnmounted, ref } from "vue";

const surfaces = [
  "Billing",
  "Payouts",
  "Risk Settings",
  "Advanced Reports",
  "Export",
];

const index = ref(0);
let timer: ReturnType<typeof setInterval> | null = null;

onMounted(() => {
  timer = setInterval(() => {
    index.value = (index.value + 1) % surfaces.length;
  }, 2400);
});

onUnmounted(() => {
  if (timer !== null) clearInterval(timer);
});
</script>

<template>
  <div class="hero-rotator" aria-live="polite">
    <span class="prefix">Why can't this tenant see</span>
    <span class="rotator-wrap">
      <span
        v-for="(surface, i) in surfaces"
        :key="surface"
        class="rotator-token"
        :class="{ active: i === index }"
      >
        {{ surface }}
      </span>
    </span>
    <span class="suffix">?</span>
  </div>
</template>

<style scoped>
.hero-rotator {
  display: inline-flex;
  align-items: baseline;
  gap: 0.3em;
  font-size: clamp(1.25rem, 2.1vw, 1.75rem);
  font-weight: 700;
  line-height: 1.25;
  letter-spacing: -0.01em;
  color: var(--vp-c-text-2);
  white-space: nowrap;
  max-width: 100%;
}

.prefix,
.suffix {
  color: var(--vp-c-text-2);
  flex-shrink: 0;
}

/* Auto-sizes to the widest token (all tokens occupy the same grid cell,
   visible one fades up, others stay hidden in place). Result: the suffix
   "?" always sits immediately after the rotating word on the same line. */
.rotator-wrap {
  position: relative;
  display: inline-grid;
  flex-shrink: 0;
  vertical-align: baseline;
}

.rotator-token {
  grid-area: 1 / 1;
  opacity: 0;
  transform: translateY(0.35em);
  transition:
    opacity 320ms cubic-bezier(0.22, 1, 0.36, 1),
    transform 320ms cubic-bezier(0.22, 1, 0.36, 1);

  background: linear-gradient(
    90deg,
    var(--al-accent-from),
    var(--al-accent-via),
    var(--al-accent-to)
  );
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  font-weight: 800;
  letter-spacing: -0.02em;
  white-space: nowrap;
  pointer-events: none;
}

.rotator-token.active {
  opacity: 1;
  transform: translateY(0);
}

/* On very narrow screens, allow wrapping so the line doesn't overflow */
@media (max-width: 520px) {
  .hero-rotator {
    white-space: normal;
    flex-wrap: wrap;
  }
}
</style>
