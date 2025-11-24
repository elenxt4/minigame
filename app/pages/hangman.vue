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
          <div class="lives">{{ t('hangman.lives') }}: <span class="badge">{{ lives }}</span></div>
        </div>
      </header>

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

      <div class="controls">
        <p v-if="gameWon" class="result success">{{ t('hangman.won') }} <strong>{{ word }}</strong></p>
        <p v-else-if="gameOver" class="result error">{{ t('hangman.lost') }} <strong>{{ word }}</strong></p>

        <div class="buttons">
          <NuxtButton class="btn" variant="primary" @click="resetGame">{{ t('hangman.reset') }}</NuxtButton>
          <NuxtButton class="btn" variant="ghost" @click="goBackToDashboard">{{ t('hangman.back') }}</NuxtButton>
        </div>
      </div>
    </NuxtCard>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter } from '#imports';
import { useI18n } from 'vue-i18n';
import { useGameStore } from '../../stores/game';
import NuxtButton from '../components/NuxtButton.vue';
import NuxtCard from '../components/NuxtCard.vue';

// word lists are loaded from public/hangman/easy.json
const alphabet = 'abcdefghijklmnopqrstuvwxyz'.split('');

const wordsList = ref([]);
const STARTING_LIVES = 6;

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
const lives = ref(STARTING_LIVES);
const guessed = ref([]);
const sessionPoints = ref(0)

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

const { playError, playClick, playSuccess, playApplause } = useSound()

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
      try { playApplause() } catch (e) {}
    }
  } else {
    // wrong guess: lose a life and play error sound
    lives.value -= 1;
    try { playError() } catch (e) {}
  }
};

const resetGame = () => {
  // reset to starting lives
  lives.value = STARTING_LIVES
  sessionPoints.value = 0
  guessed.value = [];
  // ensure words are loaded
  if (!wordsList.value || wordsList.value.length === 0) {
    loadWords().then(() => {
      word.value = pickWord();
    });
  } else {
    word.value = pickWord();
  }
};

const router = useRouter();
const { showLoading, hideLoading } = useLoading();
const goBackToDashboard = async () => {
  showLoading(t('hangman.returning'));
  await new Promise(resolve => setTimeout(resolve, 300));
  await router.push('/dashboard');
  hideLoading();
};

const { t, locale } = useI18n();
const setLang = (l) => { locale.value = l };

const { setPageMeta } = useSeoMeta();

setPageMeta({
  title: `${t('hangman.title')} - MiniGame`,
  description: 'Play the classic word guessing game online',
  path: '/hangman',
});
const game = useGameStore();

onMounted(async () => {
  await loadWords();
  // load persisted game stats
  try { game.load() } catch (e) {}
  // pick a fresh word after the list is loaded
  lives.value = STARTING_LIVES
  word.value = pickWord();
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
  /* CSS variables moved here so scoped styles apply correctly */
  --bg-start: #0f172a; /* dark navy */
  --bg-end: #0b1220;   /* darker */
  --card-bg: rgba(255,255,255,0.04);
  --accent: #7c3aed; /* violet */
  --accent-2: #06b6d4; /* cyan */
  --success: #16a34a;
  --danger: #dc2626;
  --muted: rgba(255,255,255,0.85);

  min-height: calc(100vh - 120px);
  display:flex;
  align-items:center;
  justify-content:center;
  padding:2rem;
  background: linear-gradient(180deg,var(--bg-start),var(--bg-end));
  color: #fff;
}

.card{
  width:100%;
  max-width:760px;
  background: linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01));
  border: 1px solid rgba(255,255,255,0.06);
  padding: 1.6rem;
  border-radius: 12px;
  box-shadow: 0 6px 30px rgba(2,6,23,0.6);
}

.card-header{ display:flex; align-items:center; justify-content:space-between; gap:1rem; }
.card-header h1{ margin:0; font-size:1.6rem; letter-spacing:0.6px }
.lives{ font-size:0.95rem; color:var(--muted) }
.badge{ display:inline-block; padding:0.18rem 0.5rem; background: linear-gradient(90deg,var(--accent),var(--accent-2)); border-radius:999px; color:#fff; font-weight:600 }

.lang{ display:flex; gap:0.4rem; margin-left:0.8rem }
.lang-btn{ background:transparent; border:1px solid rgba(255,255,255,0.06); color:var(--muted); padding:0.2rem 0.5rem; border-radius:6px; cursor:pointer }
.lang-btn:hover{ color:#fff }
.lang-btn[aria-pressed="true"], .lang-btn.active{ background:rgba(255,255,255,0.06); color:#fff }



.word{ margin:1.4rem 0; display:flex; justify-content:center; gap:0.6rem; flex-wrap:wrap }
.ch{ font-size:2.2rem; width:2rem; height:2.6rem; display:inline-flex; align-items:center; justify-content:center; background:rgba(255,255,255,0.03); border-radius:6px }
.ch.revealed{ background: linear-gradient(90deg,#667eea,#764ba2); color:#fff; transform:translateY(-4px); box-shadow:0 12px 26px rgba(12,8,30,0.45)}

.letters{ display:flex; flex-wrap:wrap; gap:0.5rem; justify-content:center; margin-top:1rem }
.letter-btn{ padding:0.55rem 0.65rem; border-radius:8px; border:1px solid rgba(255,255,255,0.06); cursor:pointer; background:transparent; color:var(--muted); min-width:40px; font-weight:600; transition:all .12s ease }
.letter-btn.guessed-correct{ background:linear-gradient(90deg,#16a34a,#34d399); color:#062617; border-color:rgba(16,185,129,0.12) }
.letter-btn.guessed-wrong{ background:linear-gradient(90deg,#ef4444,#f97316); color:#fff; border-color:rgba(220,38,38,0.12) }
.letter-btn:hover{ transform:translateY(-2px); color:#fff; box-shadow: 0 6px 18px rgba(12,8,30,0.45) }
.letter-btn:disabled{ opacity:0.35; cursor:not-allowed; transform:none; box-shadow:none }

/* small stats in header */
.stats{ display:flex; gap:0.6rem; align-items:center; margin-right:0.8rem }
.stats .score, .stats .high{ font-size:0.95rem; color:var(--muted) }

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
