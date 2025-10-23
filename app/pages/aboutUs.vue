<template>
  <div class="about-container">
    <h2>{{ t('about.title') }}</h2>
    <p>{{ t('about.content') }}</p>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
</script>

<style scoped>
.about-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 70vh;
  padding: 2rem;
  text-align: center;
}

.about-container h2 {
  color: #2c3e50;
  margin-bottom: 1rem;
  font-size: 2rem;
}

.about-container p {
  color: #555;
  max-width: 600px;
  line-height: 1.6;
  font-size: 1.1rem;
}
</style>
