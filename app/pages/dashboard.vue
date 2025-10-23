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
				<button class="play-btn primary">{{ t('dashboard.playA') }}</button>
				<button class="play-btn">{{ t('dashboard.playB') }}</button>
				<button class="play-btn" @click="recordWin">{{ t('dashboard.recordWin') }}</button>
			</div>
		</div>
	</div>
</template>

<script setup>
import { useFetch } from '#imports';
import { useI18n } from 'vue-i18n';
// fetch current user profile (returns { authenticated, profile })
const me = useFetch('/api/auth/me');
const stats = useFetch('/api/user/stats');
const { t, locale, setLocale } = useI18n();

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
