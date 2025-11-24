<template>
  <div class="home-container">
    <div class="welcome-card">
      <h1>{{ t('home.title') }}</h1>
      <p>{{ t('home.subtitle') }}</p>
      <button @click="loginBattleNet" class="battlenet-btn">
        <span class="icon">⚔️</span>
        {{ t('home.loginBattleNet') }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { useI18n } from 'vue-i18n'
import { useLoading } from '~/composables/useLoading'

const { t } = useI18n()
const { showLoading } = useLoading()

const loginBattleNet = () => {
  // Show loading spinner while redirecting
  showLoading(t('home.loggingIn'))
  // Redirect to server-side login endpoint to start OAuth flow
  window.location.href = '/api/auth/battlenet/login';
};
</script>

<style scoped>
.home-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 70vh;
  padding: 2rem;
}

.welcome-card {
  background: white;
  padding: 3rem;
  border-radius: 20px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
  text-align: center;
  max-width: 500px;
  transform: translateY(-20px);
  animation: slideIn 0.5s ease-out;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-40px);
  }
  to {
    opacity: 1;
    transform: translateY(-20px);
  }
}

.welcome-card h1 {
  color: #2c3e50;
  margin-bottom: 1.5rem;
  font-size: 2rem;
}

.welcome-card p {
  color: #555;
  margin-bottom: 2rem;
  line-height: 1.6;
  font-size: 1.1rem;
}

.battlenet-btn {
  background: linear-gradient(135deg, #148eff 0%, #0070dd 100%);
  color: white;
  border: none;
  padding: 1rem 2rem;
  font-size: 1.1rem;
  font-weight: bold;
  border-radius: 10px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  transition: transform 0.2s, box-shadow 0.2s;
  box-shadow: 0 4px 15px rgba(20, 142, 255, 0.3);
}

.battlenet-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(20, 142, 255, 0.4);
}

.battlenet-btn:active {
  transform: translateY(0);
}

.icon {
  font-size: 1.3rem;
}
</style>
