<template>
		<div class="dashboard">
			<div class="left">
				<div class="header-row">
					<h2>{{ t('dashboard.statistics') }}</h2>
				</div>
				<p class="player">{{ t('dashboard.player') }}: <strong>{{ me?.profile?.battletag|| t('dashboard.guest') }}</strong></p>
					<div class="stats">
						<NuxtCard>
								<h3>{{ t('dashboard.games') }}</h3>
							<p class="value">{{ game.gamesPlayed > 0 ? game.gamesPlayed : (stats.data?.stats?.gamesPlayed ?? '—') }}</p>
						</NuxtCard>
						<NuxtCard>
								<h3>{{ t('dashboard.wins') }}</h3>
							<p class="value">{{ game.wins > 0 ? game.wins : (stats.data?.stats?.wins ?? '—') }}</p>
						</NuxtCard>
						<NuxtCard>
								<h3>{{ t('dashboard.highScore') }}</h3>
							<p class="value">{{ game.highScore > 0 ? game.highScore : (stats.data?.stats?.highScore ?? '—') }}</p>
						</NuxtCard>
					</div>
		</div>

		<div class="right">
			<h2>{{ t('dashboard.play') }}</h2>
					<div class="actions">
						<div class="diff-selector">
							<NuxtButton :class="['diff-btn']" :variant="selectedDifficulty === 'easy' ? 'primary' : 'ghost'" @click.prevent="play('easy')">{{ t('dashboard.playA') }}</NuxtButton>
							<NuxtButton :class="['diff-btn']" :variant="selectedDifficulty === 'medium' ? 'primary' : 'ghost'" @click.prevent="play('medium')">{{ t('dashboard.playB') }}</NuxtButton>
							<NuxtButton :class="['diff-btn']" :variant="selectedDifficulty === 'hard' ? 'primary' : 'ghost'" @click.prevent="play('hard')">{{ t('dashboard.playC') }}</NuxtButton>
						</div>
					</div>
		</div>
	</div>
</template>

<script setup>
import { ref, onMounted, watch } from 'vue';
import { useFetch } from '#imports';
import { useI18n } from 'vue-i18n';
import { useRouter } from '#imports';
import { useGameStore } from '../../stores/game';
import NuxtCard from '../components/NuxtCard.vue';
import NuxtButton from '../components/NuxtButton.vue';
// fetch current user profile (returns { authenticated, profile })
const { data: me } = await useFetch('/api/auth/me');
const stats = await useFetch('/api/user/stats');
const { t, locale, setLocale } = useI18n();
const router = useRouter();

const selectedDifficulty = ref('easy');
const game = useGameStore();

onMounted(() => {
	try {
		const saved = localStorage.getItem('hangman:difficulty');
		if (saved) selectedDifficulty.value = saved;
	} catch (e) {
		// localStorage not available during SSR or blocked
	}
	try { game.load() } catch (e) {}
	try { if (stats && stats.refresh) { stats.refresh() } } catch (e) {}
});

// When another part of the app reports the server-side stats were updated
// (we set `game.lastServerUpdateAt` after a successful POST), refresh server stats
watch(() => game.lastServerUpdateAt, (v, old) => {
	if (v && v !== old) {
		try { if (stats && stats.refresh) { stats.refresh() } } catch (e) {}
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

.actions {
	display: flex;
	flex-direction: column;
	gap: 1rem;
	margin-top: 1rem;
}
.diff-selector{ display:flex; flex-direction:column; gap:0.6rem }
.diff-btn{ padding:0.8rem 1rem; border-radius:10px; border:none; cursor:pointer; font-weight:700; width:100%; text-align:center; background: #f3f4f6; color: #111827 }
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

