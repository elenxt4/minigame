<template>
  <component v-if="resolvedName" :is="resolvedName" v-bind="mergedAttrs">
    <template #header>
      <slot name="header" />
    </template>
    <template #default>
      <slot />
    </template>
  </component>

  <div v-else :class="['nuxt-fallback-card', { 'nuxt-win': win }]">
    <div v-if="$slots.header" class="nuxt-card-header"><slot name="header" /></div>
    <div id="abcd"class="nuxt-card-body"><slot /></div>
  </div>
</template>

<script setup lang="ts">
import { resolveComponent, useAttrs, computed } from 'vue'
defineOptions({ name: 'NuxtCard' })
const props = defineProps({ win: { type: Boolean, default: false } })

const candidates = ['UiCard','NCard', 'NuxtUiCard']
let resolvedName: string | null = null
for (const n of candidates) {
  try {
    const r = resolveComponent(n as any)
    if (r) { resolvedName = n; break }
  } catch (e) {}
}

const nuxtProps = { win: props.win }
const attrs = useAttrs()
const mergedAttrs = computed(() => {
  const existingClass = attrs.class || ''

  return {
    ...nuxtProps,
    ...attrs,
    class: ['nuxt-card-global', existingClass].filter(Boolean).join(' ')
  }
})
</script>

<style scoped>
.nuxt-card-global {
  /* Softer gradient, internal padding and min size so content isn't cramped */
  background: linear-gradient(180deg, rgba(166,146,237,0.95), rgba(148,148,199,0.9)) !important;
  margin: 1rem; /* reduced external spacing */
  padding: 1.2rem 1.6rem; /* make cards more roomy */
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  min-width: 160px;
  min-height: 140px;
  border-radius: 12px;
  color: #0b1220; /* dark text for contrast */
}
.nuxt-fallback-card{ background: linear-gradient(180deg,red,blue)}
.nuxt-card-header{ margin-bottom:0.6rem; font-weight:700; line-height:1.05 }
.nuxt-card-body{ display:block; background: transparent; padding: 0.2rem; color: inherit }
.nuxt-win{ animation: win-pulse 900ms ease both }
@keyframes win-pulse{ 0%{ transform:scale(1); box-shadow:0 8px 24px rgba(34,197,94,0.06) } 50%{ transform:scale(1.03); box-shadow:0 18px 40px rgba(34,197,94,0.18) } 100%{ transform:scale(1); box-shadow:0 8px 24px rgba(34,197,94,0.06) } }
</style>
