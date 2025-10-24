<template>
  <div class="hangman">
    <div class="card">
      <header class="card-header">
        <h1>{{ t('hangman.title') }}</h1>
        <div class="header-right">
          <div class="lives">{{ t('hangman.lives') }}: <span class="badge">{{ lives }}</span></div>
        </div>
      </header>

      <div class="word" aria-live="polite">
        <span v-for="(ch, i) in displayWord" :key="i" class="ch">{{ ch }}</span>
      </div>

      <div class="letters">
        <button
          v-for="l in alphabet"
          :key="l"
          :disabled="guessed.includes(l) || gameOver"
          @click="guess(l)"
          class="letter-btn"
        >
          {{ l }}
        </button>
      </div>

      <div class="controls">
        <p v-if="gameWon" class="result success">{{ t('hangman.won') }} <strong>{{ word }}</strong></p>
        <p v-else-if="gameOver" class="result error">{{ t('hangman.lost') }} <strong>{{ word }}</strong></p>

        <div class="buttons">
          <button class="btn primary" @click="resetGame">{{ t('hangman.reset') }}</button>
          <button class="btn ghost" @click="goBackToDashboard">{{ t('hangman.back') }}</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useRouter } from '#imports';
import { useI18n } from 'vue-i18n';
import { useGameStore } from '../../stores/game';

// word lists are loaded from public/hangman/{easy|medium|hard}.json
const alphabet = 'abcdefghijklmnopqrstuvwxyz'.split('');

const difficulty = ref('easy');
const wordsList = ref([]);

const loadWords = async (level) => {
  // prefer locale-specific lists: /hangman/{lang}/{level}.json
  const lang = (locale && locale.value) ? locale.value.split('-')[0] : 'en';
  const paths = [
    `/hangman/${lang}/${level}.json`,
    `/hangman/${level}.json` // fallback to old location
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
const lives = ref(5);
const guessed = ref([]);

const displayWord = computed(() => {
  return word.value.split('').map(ch => (guessed.value.includes(ch) ? ch : '_'));
});

const gameWon = computed(() => !displayWord.value.includes('_'));
const gameOver = computed(() => lives.value <= 0 || gameWon.value);

const guess = (letter) => {
  if (gameOver.value || guessed.value.includes(letter)) return;
  guessed.value.push(letter);
  if (!word.value.includes(letter)) {
    lives.value -= 1;
  }
};

const resetGame = () => {
  // ensure words are loaded for current difficulty
  if (!wordsList.value || wordsList.value.length === 0) {
    loadWords(difficulty.value).then(() => {
      word.value = pickWord();
    });
  } else {
    word.value = pickWord();
  }
  lives.value = 5;
  guessed.value = [];
};

const router = useRouter();
const goBackToDashboard = () => router.push('/dashboard');

const { t, locale } = useI18n();
const setLang = (l) => { locale.value = l };

const game = useGameStore();



onMounted(async () => {
  try {
    const saved = typeof window !== 'undefined' ? localStorage.getItem('hangman:difficulty') : null;
    if (saved) difficulty.value = saved;
  } catch (e) {
    // ignore
  }
  await loadWords(difficulty.value);
  // load persisted game stats
  try { game.load() } catch (e) {}
  // pick a fresh word after the list is loaded
  word.value = pickWord();
});

// when the language changes, reload the appropriate word list (client-only)
watch(locale, async (newLocale, oldLocale) => {
  try {
    // reload words for the current difficulty and pick a new word
    await loadWords(difficulty.value);
    word.value = pickWord();
  } catch (e) {
    // ignore
  }
});

// When we win, add points and record win in the store
watch(gameWon, async (v) => {
  if (v) {
    const points = (lives.value || 0) * 100
    try { game.addScore(points) } catch (e) {}
    try { game.recordWin() } catch (e) {}

    // Also report to server-side stats endpoint (best-effort)
    try {
      await $fetch('/api/user/stats', {
        method: 'POST',
        body: { increment: { gamesPlayed: 1, wins: 1, highScore: game.highScore } }
      })
      // notify local store that server-side stats were updated so other pages (dashboard)
      // can react and refresh their server-backed data immediately
      try { game.markServerUpdated() } catch (e) { /* ignore */ }
    } catch (e) {
      // ignore network errors
    }
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

.letters{ display:flex; flex-wrap:wrap; gap:0.5rem; justify-content:center; margin-top:1rem }
.letter-btn{ padding:0.55rem 0.65rem; border-radius:8px; border:1px solid rgba(255,255,255,0.06); cursor:pointer; background:transparent; color:var(--muted); min-width:40px; font-weight:600; transition:all .12s ease }
.letter-btn:hover{ transform:translateY(-2px); color:#fff; box-shadow: 0 6px 18px rgba(12,8,30,0.45) }
.letter-btn:disabled{ opacity:0.35; cursor:not-allowed; transform:none; box-shadow:none }

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
