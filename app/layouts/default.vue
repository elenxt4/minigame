<template>
  <div>
    <HeaderComponent />
    <main>
      <NuxtPage />
    </main>
    <FooterComponent />
  </div>
</template>

<script setup>
import Header from '~/components/header.vue'
import Footer from '~/components/footer.vue'
</script>