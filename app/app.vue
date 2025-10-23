<template>
  <div class="app-wrapper">
    <NuxtRouteAnnouncer />
    <Header />
    <main class="main-content">
      <NuxtPage />
    </main>
    <Footer />
  </div>
</template>

<script setup>
import Header from './components/header.vue';
import Footer from './components/footer.vue';
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
