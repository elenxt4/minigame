<template>
  <footer class="footer">
    <div class="container">
      <p>&copy; {{ t('footer.content') }}</p>
    </div>
  </footer>
</template>
<script setup lang="ts">
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
</script>
<style scoped>
.footer {
  background: #2c3e50;
  color: white;
  padding: 2rem 0;
  margin-top: auto;
  text-align: center;
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
}

.footer p {
  margin: 0;
  font-size: 0.9rem;
}
</style>
