<template>
  <div class="guess-number-page">
    <div class="container">
      <NuxtCard class="game-card" :class="{ 'win-pulse': won, 'shake': shakeCard }">
        <div class="game-header">
          <h1>{{ t('guessNumber.title') }}</h1>
          <div class="stats">
            <span>{{ t('guessNumber.score') }}: {{ game.guessNumber.currentScore }}</span>
            <span>{{ t('guessNumber.highScore') }}: {{ game.guessNumber.highScore }}</span>
          </div>
        </div>

        <div v-if="!gameStarted" class="start-screen">
          <p class="instructions">{{ t('guessNumber.instructions') }}</p>
          <NuxtButton variant="primary" @click="startGame">{{ t('guessNumber.start') }}</NuxtButton>
        </div>

        <div v-else class="game-area">
          <div class="game-info">
            <p class="range-hint">{{ t('guessNumber.range', { min: 1, max: 100 }) }}</p>
            <p class="attempts">{{ t('guessNumber.attemptsLeft', { count: attemptsLeft }) }}</p>
          </div>

          <div v-if="!won && attemptsLeft > 0" class="input-area">
            <input 
              type="number" 
              v-model.number="currentGuess" 
              :min="1" 
              :max="100"
              :placeholder="t('guessNumber.enterGuess')"
              @keyup.enter="makeGuess"
              :disabled="processing"
              class="guess-input"
            />
            <NuxtButton 
              variant="primary" 
              @click="makeGuess"
              :disabled="processing || !isValidGuess"
            >
              {{ t('guessNumber.submit') }}
            </NuxtButton>
          </div>

          <div v-if="feedback" class="feedback" :class="feedbackClass">
            {{ feedback }}
          </div>

          <div v-if="guessHistory.length > 0" class="history">
            <h3>{{ t('guessNumber.history') }}</h3>
            <div class="history-list">
              <span 
                v-for="(guess, idx) in guessHistory" 
                :key="idx"
                class="history-item"
                :class="{ 'too-low': guess < targetNumber, 'too-high': guess > targetNumber }"
              >
                {{ guess }}
              </span>
            </div>
          </div>

          <div v-if="won || attemptsLeft === 0" class="game-over">
            <div v-if="won" class="win-message">
              <h2>🎉 {{ t('guessNumber.winMessage') }}</h2>
              <p>{{ t('guessNumber.correctNumber', { number: targetNumber }) }}</p>
              <p class="points">{{ t('guessNumber.earnedPoints', { points: sessionPoints }) }}</p>
            </div>
            <div v-else class="lose-message">
              <h2>{{ t('guessNumber.loseMessage') }}</h2>
              <p>{{ t('guessNumber.correctNumberWas', { number: targetNumber }) }}</p>
            </div>
            <NuxtButton variant="primary" @click="resetGame">{{ t('guessNumber.playAgain') }}</NuxtButton>
          </div>
        </div>
      </NuxtCard>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useGameStore } from '../../stores/game';
import NuxtCard from '../components/NuxtCard.vue';
import NuxtButton from '../components/NuxtButton.vue';

const { t } = useI18n();
const { playClick, playError, playSuccess, playApplause } = await import('../../composables/useSound').then(m => m.useSound());

const MAX_ATTEMPTS = 10;
const game = useGameStore();

const gameStarted = ref(false);
const targetNumber = ref(0);
const currentGuess = ref(null);
const attemptsLeft = ref(MAX_ATTEMPTS);
const guessHistory = ref([]);
const won = ref(false);
const feedback = ref('');
const feedbackClass = ref('');
const processing = ref(false);
const sessionPoints = ref(0);
const shakeCard = ref(false);

const isValidGuess = computed(() => {
  return currentGuess.value >= 1 && currentGuess.value <= 100;
});

const startGame = () => {
  playClick();
  targetNumber.value = Math.floor(Math.random() * 100) + 1;
  gameStarted.value = true;
  attemptsLeft.value = MAX_ATTEMPTS;
  guessHistory.value = [];
  won.value = false;
  feedback.value = '';
  sessionPoints.value = 0;
  currentGuess.value = null;
};

const makeGuess = () => {
  if (!isValidGuess.value || processing.value) return;
  
  processing.value = true;
  playClick();
  
  const guess = currentGuess.value;
  guessHistory.value.push(guess);
  attemptsLeft.value--;
  
  if (guess === targetNumber.value) {
    // Win!
    won.value = true;
    feedback.value = t('guessNumber.correct');
    feedbackClass.value = 'correct';
    
    // Calculate points: more attempts left = more points
    // Base: 100 points, +10 per attempt remaining
    const pts = 100 + (attemptsLeft.value * 10);
    sessionPoints.value = pts;
    
    game.recordGameResult('guessNumber', { won: true, points: pts });
    game.guessNumber.currentScore = pts;
    
    playApplause();
  } else if (attemptsLeft.value === 0) {
    // Lost
    feedback.value = t('guessNumber.outOfAttempts');
    feedbackClass.value = 'incorrect';
    
    game.recordGameResult('guessNumber', { won: false, points: 0 });
    game.guessNumber.currentScore = 0;
    
    playError();
  } else {
    // Give hint
    if (guess < targetNumber.value) {
      feedback.value = t('guessNumber.tooLow');
      feedbackClass.value = 'hint-low';
    } else {
      feedback.value = t('guessNumber.tooHigh');
      feedbackClass.value = 'hint-high';
    }
    
    // Small shake animation
    shakeCard.value = true;
    setTimeout(() => { shakeCard.value = false; }, 500);
    playError();
  }
  
  currentGuess.value = null;
  processing.value = false;
};

const resetGame = () => {
  playClick();
  startGame();
};

onMounted(() => {
  try { game.load() } catch (e) {}
});
</script>

<style scoped>
.guess-number-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem 1rem;
}

.container {
  width: 100%;
  max-width: 600px;
}

.game-card {
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  padding: 2rem;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.game-header {
  text-align: center;
  margin-bottom: 2rem;
}

.game-header h1 {
  font-size: 2rem;
  color: #2d3748;
  margin: 0 0 1rem 0;
}

.stats {
  display: flex;
  justify-content: center;
  gap: 2rem;
  font-size: 0.9rem;
  color: #4a5568;
}

.start-screen {
  text-align: center;
  padding: 2rem 0;
}

.instructions {
  font-size: 1.1rem;
  color: #4a5568;
  margin-bottom: 2rem;
  line-height: 1.6;
}

.game-area {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.game-info {
  text-align: center;
}

.range-hint {
  font-size: 1.1rem;
  color: #4a5568;
  margin: 0 0 0.5rem 0;
}

.attempts {
  font-size: 1rem;
  color: #667eea;
  font-weight: 600;
  margin: 0;
}

.input-area {
  display: flex;
  gap: 1rem;
  align-items: center;
}

.guess-input {
  flex: 1;
  padding: 0.75rem 1rem;
  font-size: 1.1rem;
  border: 2px solid #e2e8f0;
  border-radius: 10px;
  outline: none;
  transition: all 0.2s;
  text-align: center;
}

.guess-input:focus {
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.guess-input:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.feedback {
  padding: 1rem;
  border-radius: 10px;
  text-align: center;
  font-size: 1.1rem;
  font-weight: 600;
  animation: fadeIn 0.3s ease;
}

.feedback.correct {
  background: #c6f6d5;
  color: #22543d;
}

.feedback.incorrect {
  background: #fed7d7;
  color: #742a2a;
}

.feedback.hint-low {
  background: #bee3f8;
  color: #2c5282;
}

.feedback.hint-high {
  background: #feebc8;
  color: #7c2d12;
}

.history {
  margin-top: 1rem;
}

.history h3 {
  font-size: 1rem;
  color: #4a5568;
  margin: 0 0 0.75rem 0;
  text-align: center;
}

.history-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  justify-content: center;
}

.history-item {
  padding: 0.5rem 0.75rem;
  border-radius: 8px;
  font-weight: 600;
  font-size: 0.9rem;
}

.history-item.too-low {
  background: #bee3f8;
  color: #2c5282;
}

.history-item.too-high {
  background: #feebc8;
  color: #7c2d12;
}

.game-over {
  text-align: center;
  padding: 1rem 0;
}

.win-message h2,
.lose-message h2 {
  font-size: 1.75rem;
  margin: 0 0 1rem 0;
}

.win-message {
  color: #22543d;
}

.lose-message {
  color: #742a2a;
}

.win-message p,
.lose-message p {
  font-size: 1.1rem;
  margin: 0.5rem 0;
}

.points {
  font-weight: 600;
  color: #667eea;
  font-size: 1.2rem !important;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}

.shake {
  animation: shake 0.5s ease;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-10px); }
  75% { transform: translateX(10px); }
}

.win-pulse {
  animation: winPulse 1s ease infinite;
}

@keyframes winPulse {
  0%, 100% { box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3); }
  50% { box-shadow: 0 20px 60px rgba(102, 126, 234, 0.6); }
}
</style>
