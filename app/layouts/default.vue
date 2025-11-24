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
    <LoadingSpinner :show="isLoading" :message="loadingMessage" />
  </div>
</template>

<script setup>
import Header from '~/components/header.vue'
import Footer from '~/components/footer.vue'
import LoadingSpinner from '~/components/LoadingSpinner.vue'
import { useLoading } from '~/composables/useLoading'

const { isLoading, loadingMessage } = useLoading()
</script>