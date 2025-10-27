.template-block{display:none}
<template>
  <component
    v-if="resolvedName"
    :is="resolvedName"
    v-bind="mergedAttrs"
    @click="$emit('click', $event)">
    <slot />
  </component>

  <button
    v-else
    v-bind="mergedAttrs"
    :class="['nuxt-fallback-btn', `nuxt-${variant}`, `nuxt-${size}`]"
    :disabled="disabled"
    @click="$emit('click', $event)">
    <slot />
  </button>
</template>

<script setup lang="ts">
import { resolveComponent, useAttrs, computed } from 'vue'
const emit = defineEmits(['click'])
const props = defineProps({
  variant: { type: String, default: 'primary' },
  size: { type: String, default: 'md' },
  disabled: { type: Boolean, default: false }
})

const candidates = ['UiButton','NButton', 'NuxtUiButton', 'UiBtn']
let resolvedName: string | null = null
for (const n of candidates) {
  try {
    const r = resolveComponent(n as any)
    if (r) { resolvedName = n; break }
  } catch (e) {}
}

const nuxtProps = {
  variant: props.variant,
  size: props.size,
  disabled: props.disabled
}
const attrs = useAttrs()
const mergedAttrs = computed(() => ({ ...nuxtProps, ...attrs }))
</script>

<style scoped>
.nuxt-fallback-btn{ display:inline-flex; align-items:center; justify-content:center; gap:0.5rem; border-radius:10px; border:none; cursor:pointer; font-weight:700; transition:all .14s ease; padding:0.6rem 0.9rem }
.nuxt-md{ padding:0.6rem 0.9rem; font-size:0.95rem }
.nuxt-sm{ padding:0.45rem 0.7rem; font-size:0.86rem }
.nuxt-lg{ padding:0.9rem 1.1rem; font-size:1.02rem }
.nuxt-primary{ background: linear-gradient(90deg,#667eea,#764ba2); color:#fff }
.nuxt-ghost{ background:transparent; color:inherit; border:1px solid rgba(0,0,0,0.06) }
.nuxt-fallback-btn:disabled{ opacity:0.45; cursor:not-allowed }

/* Button micro-interactions */
.nuxt-fallback-btn{ transition: transform .14s cubic-bezier(.2,.9,.3,1), box-shadow .14s ease, opacity .14s ease }
.nuxt-fallback-btn:hover{ transform: translateY(-2px) scale(1.02); box-shadow: 0 10px 20px rgba(22,33,62,0.09) }
.nuxt-fallback-btn:active{ transform: translateY(0) scale(.995); box-shadow: 0 6px 12px rgba(22,33,62,0.06) }
.nuxt-fallback-btn:focus{ outline: none; box-shadow: 0 0 0 4px rgba(102,126,234,0.12) }
</style>
