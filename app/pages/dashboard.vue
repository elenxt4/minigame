<template>
		<div class="dashboard">
			<div class="left">
				<div class="header-row">
					<h2>{{ t('dashboard.statistics') }}</h2>
				</div>
				<p class="player">{{ t('dashboard.player') }}: <strong>{{ me.data?.profile?.name || t('dashboard.guest') }}</strong></p>
			<div class="stats">
				<div class="stat-card">
					<h3>Games played</h3>
					<p class="value">{{ stats.data?.stats?.gamesPlayed ?? '—' }}</p>
				</div>
				<div class="stat-card">
					<h3>Wins</h3>
					<p class="value">{{ stats.data?.stats?.wins ?? '—' }}</p>
				</div>
				<div class="stat-card">
					<h3>High Score</h3>
					<p class="value">{{ stats.data?.stats?.highScore ?? '—' }}</p>
				</div>
			</div>
		</div>

		<div class="right">
			<h2>{{ t('dashboard.play') }}</h2>
					<div class="actions">
						<div class="diff-selector">
							<button :class="['diff-btn', { active: selectedDifficulty === 'easy' }]" @click.prevent="play('easy')">{{ t('dashboard.playA') }}</button>
							<button :class="['diff-btn', { active: selectedDifficulty === 'medium' }]" @click.prevent="play('medium')">{{ t('dashboard.playB') }}</button>
							<button :class="['diff-btn', { active: selectedDifficulty === 'hard' }]" @click.prevent="play('hard')">{{ t('dashboard.playC') }}</button>
						</div>
					</div>
		</div>
	</div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useFetch } from '#imports';
import { useI18n } from 'vue-i18n';
import { useRouter } from '#imports';
// fetch current user profile (returns { authenticated, profile })
const me = useFetch('/api/auth/me');
const stats = useFetch('/api/user/stats');
const { t, locale, setLocale } = useI18n();
const router = useRouter();

const selectedDifficulty = ref('easy');

onMounted(() => {
	try {
		const saved = localStorage.getItem('hangman:difficulty');
		if (saved) selectedDifficulty.value = saved;
	} catch (e) {
		// localStorage not available during SSR or blocked
	}
});

const play = (level) => {
	selectedDifficulty.value = level;
	try {
		if (typeof window !== 'undefined' && window.localStorage) {
			localStorage.setItem('hangman:difficulty', level);
		}
	} catch (e) {
		// ignore localStorage errors
	}
	router.push('/hangman');
};

const recordWin = async () => {
	await $fetch('/api/user/stats', { method: 'POST', body: { increment: { gamesPlayed: 1, wins: 1, highScore: 1200 } } });
	await stats.refresh();
};
</script>

<style scoped>
.dashboard {
	display: grid;
	grid-template-columns: 2fr 1fr;
	gap: 2rem;
	padding: 2rem;
}
.left, .right {
	background: #fff;
	border-radius: 12px;
	padding: 1.5rem;
	box-shadow: 0 8px 24px rgba(0,0,0,0.06);
}
.stats {
	display: flex;
	gap: 1rem;
	margin-top: 1rem;
}
.stat-card {
	flex: 1;
	background: linear-gradient(180deg,#f8fafc,#fff);
	border-radius: 8px;
	padding: 1rem;
	text-align: center;
}
.stat-card .value {
	font-size: 1.6rem;
	font-weight: 700;
	color: #2c3e50;
}
.actions {
	display: flex;
	flex-direction: column;
	gap: 1rem;
	margin-top: 1rem;
}
.diff-selector{ display:flex; flex-direction:column; gap:0.6rem }
.diff-btn{ padding:0.8rem 1rem; border-radius:10px; border:none; cursor:pointer; font-weight:700; width:100%; text-align:center }
.diff-btn.active{ background: linear-gradient(135deg,#667eea,#764ba2); color: #fff }
.play-btn {
	padding: 1rem 1.2rem;
	border-radius: 10px;
	border: none;
	cursor: pointer;
	font-weight: 700;
}
.play-btn.primary {
	background: linear-gradient(135deg,#667eea,#764ba2);
	color: white;
}
.play-btn:not(.primary) {
	background: #f3f4f6;
	color: #111827;
}

@media (max-width: 800px) {
	.dashboard { grid-template-columns: 1fr; }
}
</style>
