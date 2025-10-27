<template>
  <!-- Prefer an installed Nuxt UI card if present; otherwise use local markup -->
  <component v-if="nuxtCardName" :is="nuxtCardName" v-bind="nuxtProps">
    <template #header>
      <slot name="header" />
    </template>
    <template #default>
      <slot />
    </template>
  </component>

  <div v-else :class="['ui-card', { 'ui-card-win': win }]">
    <div v-if="$slots.header" class="ui-card-header">
      <slot name="header" />
    </div>
    <div class="ui-card-body">
      <slot />
    </div>
  </div>
</template>

<script setup lang="ts">
import { resolveComponent } from 'vue'
const props = defineProps({ win: { type: Boolean, default: false } })

const candidateNames = ['NuxtCard', 'UiCard', 'NCard', 'NuxtUiCard']
let nuxtCardName: string | null = null
for (const n of candidateNames) {
  try {
    const resolved = resolveComponent(n as any)
    if (resolved) { nuxtCardName = n; break }
  } catch (e) {
    // ignore
  }
}

const nuxtProps = {
  /* try to surface a 'win' or 'accent' prop if a Nuxt UI card uses it */
  win: props.win
}
</script>

<style scoped>
.ui-card{
  /* use CSS variables so pages can override theme (dark card for hangman, light for dashboard)
     default: light card */
  background: var(--ui-card-bg, linear-gradient(180deg, rgba(255,255,255,0.98), #fff));
  color: var(--ui-card-color, inherit);
  border-radius:12px;
  padding:1rem;
  box-shadow: var(--ui-card-shadow, 0 8px 24px rgba(2,6,23,0.06));
  transition:transform .18s ease, box-shadow .18s ease;
}
.ui-card-header{ margin-bottom:0.6rem; font-weight:700 }
.ui-card-body{ display:block }
.ui-card-win{ animation: win-pulse 900ms ease both }
@keyframes win-pulse{ 0%{ transform:scale(1); box-shadow:0 8px 24px rgba(34,197,94,0.06) } 50%{ transform:scale(1.03); box-shadow:0 18px 40px rgba(34,197,94,0.18) } 100%{ transform:scale(1); box-shadow:0 8px 24px rgba(34,197,94,0.06) } }
</style>
