<template>
  <div class="app-wrapper">
    <NuxtRouteAnnouncer />
    <main class="main-content">
      <NuxtLayout>
        <NuxtPage />
      </NuxtLayout>
    </main>
  </div>
</template>

<script setup>
import Header from './components/header.vue';
import Footer from './components/footer.vue';
// Global animations & helpers (relative import so Vite resolves correctly from the app dir)
import './assets/css/main.css';
</script>

<style>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
}

html, body, #__nuxt {
  height: 100%;
}

.app-wrapper {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.main-content {
  flex: 1;
}
</style>
