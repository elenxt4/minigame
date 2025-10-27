<template>
  <div>
    <Header />
    <main>
      <!-- page transition: fade + subtle slide for smoother navigation -->
      <transition name="page" mode="out-in">
        <NuxtPage />
      </transition>
    </main>
    <Footer />
  </div>
</template>

<script setup>
import Header from '~/components/header.vue'
import Footer from '~/components/footer.vue'
</script>