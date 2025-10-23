<template>
  <header class="header">
    <div class="container">
      <div class="logo">
        <NuxtLink to="/">
          <h1>MiniGame</h1>
        </NuxtLink>
      </div>
      <nav class="nav">
        <NuxtLink to="/">{{ t('nav.home') }}</NuxtLink>
        <NuxtLink to="/aboutUs">{{ t('nav.about') }}</NuxtLink>
        <button @click="toggleLanguage" class="translator-btn">
          {{ locale === 'es' ? 'EN' : 'ES' }}
        </button>
      </nav>
    </div>
  </header>
</template>

<script setup>
import { useI18n } from 'vue-i18n';
import { useFetch, useNuxtApp } from '#imports';

const { t, locale, setLocale } = useI18n();

const me = useFetch('/api/auth/me');

const logout = async () => {
  await fetch('/api/auth/logout', { method: 'POST' });
  // reload to update UI
  window.location.reload();
};

const toggleLanguage = () => {
  setLocale(locale.value === 'es' ? 'en' : 'es');
};
</script>

<style scoped>
.header {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 1rem 0;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.container {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 1rem;
}

.logo h1 {
  margin: 0;
  font-size: 1.8rem;
  font-weight: bold;
}

.logo a {
  color: white;
  text-decoration: none;
  cursor: pointer;
  transition: opacity 0.3s;
}

.logo a:hover {
  opacity: 0.9;
}

.nav {
  display: flex;
  gap: 2rem;
  align-items: center;
}

.nav a {
  color: white;
  text-decoration: none;
  font-weight: 500;
  transition: opacity 0.3s;
}

.nav a:hover {
  opacity: 0.8;
}

.nav a.router-link-active {
  border-bottom: 2px solid white;
}

.translator-btn {
  background: rgba(255, 255, 255, 0.2);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.3);
  padding: 0.4rem 0.8rem;
  border-radius: 6px;
  cursor: pointer;
  font-weight: 500;
  transition: all 0.3s;
  font-size: 0.85rem;
  display: flex;
  align-items: center;
  gap: 0.3rem;
  white-space: nowrap;
  height: fit-content;
}

.translator-btn:hover {
  background: rgba(255, 255, 255, 0.3);
  transform: translateY(-2px);
}
</style>
