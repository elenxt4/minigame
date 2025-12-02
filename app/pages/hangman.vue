<template>
  <div class="hangman">
    <NuxtCard :win="gameWon" class="hangman-card" style="--ui-card-bg: linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01)); --ui-card-color: #fff; --ui-card-shadow: 0 6px 30px rgba(2,6,23,0.6);">
      <header class="card-header">
        <h1>{{ t('hangman.title') }}</h1>
        <div class="header-right">
          <div class="stats">
            <div class="score">{{ t('hangman.score') }}: <strong>{{ game.score }}</strong></div>
            <div class="high">{{ t('hangman.highScore') }}: <strong>{{ game.highScore }}</strong></div>
          </div>
        </div>
      </header>

      <div v-if="!gameStarted" class="start-screen">
        <p class="instructions">{{ t('hangman.instructions') }}</p>
        
        <div class="difficulty-selector">
          <h2>{{ t('hangman.selectDifficulty') }}</h2>
          <div class="difficulty-buttons">
            <button 
              v-for="level in difficulties" 
              :key="level.id"
              :class="['difficulty-btn', { active: selectedDifficulty === level.id }]"
              @click="selectedDifficulty = level.id"
            >
              <span class="difficulty-icon">{{ level.icon }}</span>
              <span class="difficulty-name">{{ t(`hangman.${level.id}`) }}</span>
              <span class="difficulty-desc">{{ t(`hangman.${level.id}Desc`) }}</span>
            </button>
          </div>
        </div>
        
        <NuxtButton variant="primary" @click="startGame(selectedDifficulty)">{{ t('hangman.start') }}</NuxtButton>
      </div>

      <div v-if="gameStarted" class="game-area">
        <div class="game-info">
          <p class="difficulty-badge">{{ t(`hangman.${currentDifficulty}`) }} {{ difficulties.find(d => d.id === currentDifficulty)?.icon }}</p>
          <p class="lives-display">{{ t('hangman.lives') }}: <span class="badge">{{ lives }}</span></p>
        </div>

        <div class="word" aria-live="polite">
          <span v-for="(ch, i) in displayWord" :key="i" :class="['ch', { revealed: ch !== '_' }]">{{ ch }}</span>
        </div>

        <div class="letters">
          <NuxtButton v-for="l in alphabet" :key="l" :disabled="guessed.includes(l) || gameOver" size="sm" variant="ghost" class="letter-btn"
            :class="{
              'guessed-correct': letterState[l].used && letterState[l].correct,
              'guessed-wrong': letterState[l].used && !letterState[l].correct
            }"
            @click="guess(l)">{{ l }}</NuxtButton>
        </div>

        <div v-if="gameWon || gameOver" class="game-over">
          <div v-if="gameWon" class="win-message">
            <h2>🎉 {{ t('hangman.won') }}</h2>
            <p>{{ t('hangman.wordWas') }} <strong>{{ word }}</strong></p>
            <p class="points">{{ t('hangman.earnedPoints', { points: sessionPoints }) }}</p>
          </div>
          <div v-else class="lose-message">
            <h2>{{ t('hangman.lost') }}</h2>
            <p>{{ t('hangman.wordWas') }} <strong>{{ word }}</strong></p>
          </div>
          <NuxtButton variant="primary" @click="resetGame">{{ t('hangman.playAgain') }}</NuxtButton>
        </div>
      </div>

      <div class="back-button">
        <NuxtButton variant="ghost" @click="goBackToDashboard">{{ t('hangman.back') }}</NuxtButton>
      </div>
    </NuxtCard>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter } from '#imports';
import { useI18n } from 'vue-i18n';
import { useGameStore } from '../stores/game';
import NuxtButton from '../components/NuxtButton.vue';
import NuxtCard from '../components/NuxtCard.vue';

const { t, locale } = useI18n();
const setLang = (l) => { locale.value = l };
const { playClick, playError, playSuccess, playApplause } = await import('../composables/useSound').then(m => m.useSound());
const router = useRouter();
const { showLoading, hideLoading } = useLoading();
const game = useGameStore();

// word lists are loaded from public/hangman/easy.json
const alphabet = 'abcdefghijklmnopqrstuvwxyz'.split('');

const difficulties = [
  { id: 'easy',  lives: 8 },
  { id: 'medium', lives: 6 },
  { id: 'hard',  lives: 4 }
];

const DIFFICULTY_LIVES = {
  easy: 8,
  medium: 6,
  hard: 4
};

const wordsList = ref([]);
const gameStarted = ref(false);
const selectedDifficulty = ref('medium');
const currentDifficulty = ref('medium');

function uploadScore(){
  fetch('http://localhost:8080/api/rankings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      battle_tag: game.user || 'guest',
      score: game.hangman.currentScore,
      difficulty_level: difficulties.find(d => d.id === currentDifficulty.value)?.id === 'easy' ? 1 : difficulties.find(d => d.id === currentDifficulty.value)?.id === 'medium' ? 2 : 3,
    })
})
}

const loadWords = async () => {
  // prefer locale-specific lists: /hangman/{lang}/easy.json
  const lang = (locale && locale.value) ? locale.value.split('-')[0] : 'en';
  const paths = [
    `/hangman/${lang}/easy.json`,
    `/hangman/easy.json` // fallback to old location
  ];

  for (const p of paths) {
    try {
      const res = await fetch(p);
      if (!res.ok) throw new Error('not ok');
      const json = await res.json();
      wordsList.value = Array.isArray(json) ? json.map(w => String(w).toLowerCase()) : [];
      return;
    } catch (err) {
      // try next path
    }
  }
  // final fallback
  wordsList.value = ['javascript'];
};

const pickWord = () => {
  if (!wordsList.value || wordsList.value.length === 0) return 'javascript';
  return wordsList.value[Math.floor(Math.random() * wordsList.value.length)];
};

// start empty so we don't show the default before the JSON is loaded
const word = ref('');
const lives = ref(DIFFICULTY_LIVES.medium);
const guessed = ref([]);
const sessionPoints = ref(0);

const startGame = (difficulty) => {
  currentDifficulty.value = difficulty;
  lives.value = DIFFICULTY_LIVES[difficulty];
  gameStarted.value = true;
  sessionPoints.value = 0;
  guessed.value = [];
  
  if (!wordsList.value || wordsList.value.length === 0) {
    loadWords().then(() => {
      word.value = pickWord();
    });
  } else {
    word.value = pickWord();
  }
};

// visual state helper: map letter -> { used: boolean, correct: boolean }
const letterState = computed(() => {
  const m = {}
  for (const ch of alphabet) {
    const used = guessed.value.includes(ch)
    const correct = used && word.value.includes(ch)
    m[ch] = { used, correct }
  }
  return m
})

const displayWord = computed(() => {
  return word.value.split('').map(ch => (guessed.value.includes(ch) ? ch : '_'));
});

const gameWon = computed(() => !displayWord.value.includes('_'));
const gameOver = computed(() => lives.value <= 0 || gameWon.value);

const guess = (letter) => {
  if (gameOver.value || guessed.value.includes(letter)) return;
  guessed.value.push(letter);
  // small click feedback
  try { playClick() } catch (e) {}

  if (word.value.includes(letter)) {
    // award small points per correct letter
    const pts = 10
    sessionPoints.value += pts
    // gentle success tone
    try { playSuccess() } catch (e) {}
    // if this correct guess completed the word, play applause immediately for better UX
    if (gameWon.value) {
      uploadScore();
      try { playApplause() } catch (e) {}
    }
  } else {
    // wrong guess: lose a life and play error sound
    lives.value -= 1;
    try { playError() } catch (e) {}
  }
};

const resetGame = () => {
  // reset to difficulty selection
  gameStarted.value = false;
  lives.value = DIFFICULTY_LIVES.medium;
  sessionPoints.value = 0;
  guessed.value = [];
  word.value = '';
};

const goBackToDashboard = async () => {
  showLoading(t('hangman.returning'));
  await new Promise(resolve => setTimeout(resolve, 300));
  await router.push('/dashboard');
  hideLoading();
};




onMounted(async () => {
  await loadWords();
  // load persisted game stats
  try { game.load() } catch (e) {}
  // don't start game automatically - wait for difficulty selection
});

// when the language changes, reload the appropriate word list (client-only)
watch(locale, async (newLocale, oldLocale) => {
  try {
    // reload words and pick a new word
    await loadWords();
    word.value = pickWord();
  } catch (e) {
    // ignore
  }
});

// When we win, add points and record win in the store
watch(gameWon, async (v) => {
  if (v) {
    const points = (lives.value || 0) * 100 + sessionPoints.value
    try { 
      game.recordGameResult('hangman', { won: true, points })
      game.hangman.currentScore = points
    } catch (e) {}

    // Also report to server-side stats endpoint (best-effort)
    try {
      await $fetch('/api/user/stats', {
        method: 'POST',
        body: { increment: { gamesPlayed: 1, wins: 1, highScore: game.highScore } }
      })
      try { game.markServerUpdated() } catch (e) { /* ignore */ }
    } catch (e) {
      // ignore network errors
    }
  }
});

// When the player loses (gameOver but not gameWon), record the loss and notify server
watch(gameOver, async (v) => {
  if (v && !gameWon.value) {
    try { 
      game.recordGameResult('hangman', { won: false, points: 0 })
      game.hangman.currentScore = 0
    } catch (e) {}
    try {
      await $fetch('/api/user/stats', {
        method: 'POST',
        body: { increment: { gamesPlayed: 1 } }
      })
      try { game.markServerUpdated() } catch (e) { /* ignore */ }
    } catch (e) {
      // ignore network errors
    }
    // play a losing/error sound so the player gets audible feedback on loss
    try { playError() } catch (e) {}
  }
});

</script>

<style scoped>
.hangman{
  min-height: calc(100vh - 120px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.container {
  width: 100%;
  max-width: 900px;
}

.hangman-card {
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

.header-right { 
  display: flex; 
  flex-direction: column; 
  gap: 0.5rem; 
  align-items: center;
}

.lives{ 
  font-size: 0.95rem; 
  color: #4a5568;
}

.badge{ 
  display: inline-block; 
  padding: 0.3rem 0.8rem; 
  background: linear-gradient(90deg, #667eea, #764ba2); 
  border-radius: 999px; 
  color: #fff; 
  font-weight: 600;
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

.difficulty-selector {
  margin: 2rem 0;
}

.difficulty-selector h2 {
  font-size: 1.2rem;
  color: #2d3748;
  margin: 0 0 1rem 0;
  text-align: center;
}

.difficulty-buttons {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
}

.difficulty-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 1.5rem 1rem;
  background: linear-gradient(135deg, #f5f7fa 0%, #e2e8f0 100%);
  border: 3px solid transparent;
  border-radius: 15px;
  cursor: pointer;
  transition: all 0.3s ease;
  min-width: 140px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
}

.difficulty-btn:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
}

.difficulty-btn.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-color: #667eea;
  box-shadow: 0 8px 25px rgba(102, 126, 234, 0.4);
}

.difficulty-btn.active .difficulty-name,
.difficulty-btn.active .difficulty-desc {
  color: white;
}

.difficulty-icon {
  font-size: 2.5rem;
}

.difficulty-name {
  font-size: 1.1rem;
  font-weight: 700;
  color: #2d3748;
  text-transform: capitalize;
}

.difficulty-desc {
  font-size: 0.85rem;
  color: #4a5568;
  text-align: center;
}

.game-area {
  margin-top: 1rem;
}

.lang{ display:flex; gap:0.4rem; margin-left:0.8rem }
.lang-btn{ background:transparent; border:1px solid rgba(255,255,255,0.06); color:var(--muted); padding:0.2rem 0.5rem; border-radius:6px; cursor:pointer }
.lang-btn:hover{ color:#fff }
.lang-btn[aria-pressed="true"], .lang-btn.active{ background:rgba(255,255,255,0.06); color:#fff }



.game-info {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 2rem;
  margin-bottom: 1.5rem;
  padding: 1rem;
  background: rgba(102, 126, 234, 0.1);
  border-radius: 12px;
}

.difficulty-badge {
  font-size: 1rem;
  font-weight: 600;
  color: #2d3748;
  margin: 0;
}

.lives-display {
  font-size: 1rem;
  color: #2d3748;
  margin: 0;
}

.word{ 
  margin: 1.4rem 0; 
  display: flex; 
  justify-content: center; 
  gap: 0.6rem; 
  flex-wrap: wrap;
}

.ch{ 
  font-size: 2.2rem; 
  width: 2rem; 
  height: 2.6rem; 
  display: inline-flex; 
  align-items: center; 
  justify-content: center; 
  background: linear-gradient(135deg, #f5f7fa 0%, #e2e8f0 100%);
  border-radius: 8px;
  color: #2d3748;
  font-weight: 600;
}

.ch.revealed{ 
  background: linear-gradient(90deg, #667eea, #764ba2); 
  color: #fff; 
  transform: translateY(-4px); 
  box-shadow: 0 12px 26px rgba(102, 126, 234, 0.4);
}

.letters{ 
  display: flex; 
  flex-wrap: wrap; 
  gap: 0.5rem; 
  justify-content: center; 
  margin-top: 1rem;
}

.letter-btn{ 
  padding: 0.55rem 0.65rem; 
  border-radius: 8px; 
  border: 2px solid rgba(102, 126, 234, 0.2);
  cursor: pointer; 
  background: rgba(255, 255, 255, 0.8);
  color: #2d3748;
  min-width: 40px; 
  font-weight: 600; 
  transition: all 0.2s ease;
}

.letter-btn.guessed-correct{ 
  background: linear-gradient(90deg, #16a34a, #34d399); 
  color: #fff; 
  border-color: #16a34a;
}

.letter-btn.guessed-wrong{ 
  background: linear-gradient(90deg, #ef4444, #f97316); 
  color: #fff; 
  border-color: #ef4444;
}

.letter-btn:hover{ 
  transform: translateY(-2px); 
  box-shadow: 0 6px 18px rgba(102, 126, 234, 0.3);
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: #fff;
}

.letter-btn:disabled{ 
  opacity: 0.35; 
  cursor: not-allowed; 
  transform: none; 
  box-shadow: none;
}

.game-over {
  text-align: center;
  margin-top: 2rem;
  padding: 2rem;
  background: linear-gradient(135deg, #f5f7fa 0%, #e2e8f0 100%);
  border-radius: 15px;
}

.win-message h2,
.lose-message h2 {
  font-size: 1.8rem;
  color: #2d3748;
  margin: 0 0 1rem 0;
}

.win-message p,
.lose-message p {
  font-size: 1.1rem;
  color: #4a5568;
  margin: 0.5rem 0;
}

.points {
  font-size: 1.3rem;
  font-weight: 700;
  color: #667eea;
  margin-top: 1rem !important;
}

.back-button {
  margin-top: 1.5rem;
  text-align: center;
}

/* progress bar */
.progress-wrap{ width:120px; height:8px; background:rgba(255,255,255,0.04); border-radius:999px; overflow:hidden }
.progress-fill{ height:100%; background:linear-gradient(90deg,var(--accent),var(--accent-2)); width:40% }

.controls{ margin-top:1.6rem }
.result{ font-size:1.05rem; margin-bottom:0.8rem }
.result.success{ color:var(--success) }
.result.error{ color:var(--danger) }

.buttons{ display:flex; gap:0.6rem; justify-content:center }
.btn{ padding:0.6rem 0.9rem; border-radius:8px; border:none; cursor:pointer; font-weight:700 }
.btn.primary{ background: linear-gradient(90deg,var(--accent),var(--accent-2)); color:#fff }
.btn.ghost{ background:transparent; color:var(--muted); border:1px solid rgba(255,255,255,0.06) }

@media (max-width:480px){
  .card{ padding:1rem }
  .ch{ font-size:1.6rem; width:1.6rem; height:2rem }
  .letter-btn{ min-width:34px; padding:0.45rem }
}

</style>
