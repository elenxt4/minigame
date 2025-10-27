<template>
  <!--
    Compatibility wrapper: prefer a Nuxt UI button component if registered globally
    (tries common names). Falls back to the original local button markup.
  -->
  <component
    v-if="nuxtButtonName"
    :is="nuxtButtonName"
    v-bind="nuxtProps"
    @click="$emit('click', $event)"
  >
    <slot />
  </component>

  <button
    v-else
    :class="['ui-btn', `ui-${variant}`, `ui-${size}`, { disabled: disabled } ]"
    :disabled="disabled"
    @click="$emit('click', $event)"
  >
    <slot />
  </button>
</template>

<script setup lang="ts">
import { resolveComponent } from 'vue'
const props = defineProps({
  variant: { type: String, default: 'primary' },
  size: { type: String, default: 'md' },
  disabled: { type: Boolean, default: false }
})

// Common Nuxt UI button component names to try
const candidateNames = ['NuxtButton', 'UiButton', 'NButton', 'NuxtUiButton', 'UiBtn']
let nuxtButtonName: string | null = null
for (const n of candidateNames) {
  try {
    const resolved = resolveComponent(n as any)
    if (resolved) { nuxtButtonName = n; break }
  } catch (e) {
    // resolveComponent throws if component not found — ignore
  }
}

// Map our simple props to a likely Nuxt UI props map. This is intentionally conservative.
const nuxtProps = {
  variant: props.variant,
  size: props.size,
  disabled: props.disabled
}
</script>

<style scoped>
.ui-btn{ display:inline-flex; align-items:center; justify-content:center; gap:0.5rem; border-radius:10px; border:none; cursor:pointer; font-weight:700; transition:all .14s ease; padding:0.6rem 0.9rem }
.ui-md{ padding:0.6rem 0.9rem; font-size:0.95rem }
.ui-sm{ padding:0.45rem 0.7rem; font-size:0.86rem }
.ui-lg{ padding:0.9rem 1.1rem; font-size:1.02rem }

/* Variants */
.ui-primary{ background: linear-gradient(90deg,#667eea,#764ba2); color:#fff }
.ui-ghost{ background:transparent; color:inherit; border:1px solid rgba(0,0,0,0.06) }
.ui-success{ background: linear-gradient(90deg,#10b981,#16a34a); color:#fff }
.ui-danger{ background: linear-gradient(90deg,#ef4444,#dc2626); color:#fff }

.ui-btn:hover{ transform:translateY(-3px); box-shadow:0 8px 24px rgba(2,6,23,0.12) }
.ui-btn:active{ transform:translateY(0) scale(0.995) }
.ui-btn.disabled, .ui-btn:disabled{ opacity:0.45; cursor:not-allowed; transform:none; box-shadow:none }
</style>
