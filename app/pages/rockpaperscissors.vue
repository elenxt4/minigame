<template>
  <div class="rps-page">
    <div class="container">
      <NuxtCard class="game-card" :class="{ 'win-pulse': lastResult === 'win', 'shake': shakeCard }">
        <div class="game-header">
          <h1>{{ t('rps.title') }}</h1>
          <div class="stats">
            <span>{{ t('rps.score') }}: {{ game.rps.currentScore }}</span>
            <span>{{ t('rps.highScore') }}: {{ game.rps.highScore }}</span>
          </div>
        </div>

        <div class="game-stats">
          <div class="stat-item">
            <span class="stat-label">{{ t('rps.wins') }}</span>
            <span class="stat-value">{{ sessionStats.wins }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">{{ t('rps.losses') }}</span>
            <span class="stat-value">{{ sessionStats.losses }}</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">{{ t('rps.ties') }}</span>
            <span class="stat-value">{{ sessionStats.ties }}</span>
          </div>
        </div>

        <div v-if="!gameStarted" class="start-screen">
          <p class="instructions">{{ t('rps.instructions') }}</p>
          <NuxtButton variant="primary" @click="startGame">{{ t('rps.start') }}</NuxtButton>
        </div>

        <div v-else class="game-area">
          <div class="players">
            <div class="player">
              <h3>{{ t('rps.you') }}</h3>
              <div class="choice-display" :class="{ 'revealed': playerChoice }">
                <span class="choice-icon">{{ playerChoice ? getIcon(playerChoice) : '❓' }}</span>
              </div>
            </div>

            <div class="vs">VS</div>

            <div class="player">
              <h3>{{ t('rps.opponent') }}</h3>
              <div class="choice-display" :class="{ 'revealed': opponentChoice, 'thinking': isThinking }">
                <span class="choice-icon">{{ opponentChoice ? getIcon(opponentChoice) : '🤖' }}</span>
              </div>
            </div>
          </div>

          <div v-if="!playerChoice" class="choices">
            <button 
              v-for="choice in choices" 
              :key="choice"
              class="choice-btn"
              @click="makeChoice(choice)"
              :disabled="processing"
            >
              <span class="choice-icon-large">{{ getIcon(choice) }}</span>
              <span class="choice-name">{{ t(`rps.${choice}`) }}</span>
            </button>
          </div>

          <div v-if="result" class="result" :class="resultClass">
            <h2>{{ result }}</h2>
            <p v-if="lastResult === 'win'" class="points">{{ t('rps.earnedPoints', { points: lastPoints }) }}</p>
            <NuxtButton variant="primary" @click="playAgain">{{ t('rps.playAgain') }}</NuxtButton>
          </div>
        </div>

        <div class="back-button">
          <NuxtButton variant="ghost" @click="$router.push('/dashboard')">{{ t('rps.back') }}</NuxtButton>
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

const game = useGameStore();

const choices = ['rock', 'paper', 'scissors'];
const gameStarted = ref(false);
const playerChoice = ref(null);
const opponentChoice = ref(null);
const result = ref('');
const resultClass = ref('');
const lastResult = ref(null);
const lastPoints = ref(0);
const processing = ref(false);
const isThinking = ref(false);
const shakeCard = ref(false);

const sessionStats = ref({
  wins: 0,
  losses: 0,
  ties: 0
});

const getIcon = (choice) => {
  const icons = {
    rock: '🪨',
    paper: '📄',
    scissors: '✂️'
  };
  return icons[choice] || '❓';
};

const startGame = () => {
  playClick();
  gameStarted.value = true;
  playerChoice.value = null;
  opponentChoice.value = null;
  result.value = '';
  lastResult.value = null;
};

const getRandomChoice = () => {
  const randomIndex = Math.floor(Math.random() * choices.length);
  return choices[randomIndex];
};

const determineWinner = (player, opponent) => {
  if (player === opponent) return 'tie';
  
  const winConditions = {
    rock: 'scissors',
    paper: 'rock',
    scissors: 'paper'
  };
  
  return winConditions[player] === opponent ? 'win' : 'lose';
};

const makeChoice = async (choice) => {
  if (processing.value) return;
  
  processing.value = true;
  playClick();
  playerChoice.value = choice;
  
  // Simulate thinking delay
  isThinking.value = true;
  await new Promise(resolve => setTimeout(resolve, 800));
  
  // Opponent makes random choice
  opponentChoice.value = getRandomChoice();
  isThinking.value = false;
  
  // Determine winner
  const outcome = determineWinner(playerChoice.value, opponentChoice.value);
  lastResult.value = outcome;
  
  // Update stats and points
  if (outcome === 'win') {
    sessionStats.value.wins++;
    const pts = 50;
    lastPoints.value = pts;
    
    game.recordGameResult('rps', { won: true, points: pts });
    game.rps.currentScore += pts;
    
    result.value = t('rps.youWin');
    resultClass.value = 'win';
    playApplause();
  } else if (outcome === 'lose') {
    sessionStats.value.losses++;
    
    game.recordGameResult('rps', { won: false, points: 0, isLoss: true });
    
    result.value = t('rps.youLose');
    resultClass.value = 'lose';
    shakeCard.value = true;
    setTimeout(() => { shakeCard.value = false; }, 500);
    playError();
  } else {
    sessionStats.value.ties++;
    
    game.recordGameResult('rps', { won: false, points: 0, isTie: true });
    
    result.value = t('rps.tie');
    resultClass.value = 'tie';
    playClick();
  }
  processing.value = false;
};

const playAgain = () => {
  playClick();
  playerChoice.value = null;
  opponentChoice.value = null;
  result.value = '';
  lastResult.value = null;
  lastPoints.value = 0;
};

onMounted(() => {
  try { game.load() } catch (e) {}
});
</script>

<style scoped>
.rps-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem 1rem;
}

.container {
  width: 100%;
  max-width: 700px;
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
  margin-bottom: 1.5rem;
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

.game-stats {
  display: flex;
  justify-content: center;
  gap: 2rem;
  margin-bottom: 2rem;
  padding: 1rem;
  background: rgba(240, 147, 251, 0.1);
  border-radius: 12px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
}

.stat-label {
  font-size: 0.85rem;
  color: #718096;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: #2d3748;
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
  gap: 2rem;
}

.players {
  display: flex;
  justify-content: space-around;
  align-items: center;
  gap: 1rem;
  margin: 2rem 0;
}

.player {
  flex: 1;
  text-align: center;
}

.player h3 {
  font-size: 1.1rem;
  color: #4a5568;
  margin: 0 0 1rem 0;
}

.choice-display {
  width: 120px;
  height: 120px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
  border-radius: 20px;
  box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.choice-display.revealed {
  background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);
  transform: scale(1.05);
}

.choice-display.thinking {
  animation: thinking 0.8s ease infinite;
}

@keyframes thinking {
  0%, 100% { transform: rotate(-5deg); }
  50% { transform: rotate(5deg); }
}

.choice-icon {
  font-size: 4rem;
}

.vs {
  font-size: 1.5rem;
  font-weight: 700;
  color: #e53e3e;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.1);
}

.choices {
  display: flex;
  justify-content: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.choice-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 1.5rem 1rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 15px;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);
  min-width: 120px;
}

.choice-btn:hover:not(:disabled) {
  transform: translateY(-5px) scale(1.05);
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.6);
}

.choice-btn:active:not(:disabled) {
  transform: translateY(-2px) scale(1.02);
}

.choice-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.choice-icon-large {
  font-size: 3rem;
}

.choice-name {
  font-size: 1rem;
  font-weight: 600;
  text-transform: capitalize;
}

.result {
  text-align: center;
  padding: 2rem;
  border-radius: 15px;
  animation: fadeIn 0.5s ease;
}

.result h2 {
  font-size: 2rem;
  margin: 0 0 1rem 0;
}

.result.win {
  background: linear-gradient(135deg, #d4fc79 0%, #96e6a1 100%);
  color: #22543d;
}

.result.lose {
  background: linear-gradient(135deg, #fa709a 0%, #fee140 100%);
  color: #742a2a;
}

.result.tie {
  background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%);
  color: #2d3748;
}

.points {
  font-weight: 600;
  font-size: 1.2rem;
  margin: 0.5rem 0 1rem 0;
}

.back-button {
  margin-top: 2rem;
  text-align: center;
}

@keyframes fadeIn {
  from { opacity: 0; transform: scale(0.9); }
  to { opacity: 1; transform: scale(1); }
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
  50% { box-shadow: 0 20px 60px rgba(240, 147, 251, 0.6); }
}
</style>
