<template>
		<div class="dashboard">
			<div class="stats-section">
				<div class="header-row">
					<h2>{{ t('dashboard.statistics') }}</h2>
				</div>
				<p class="player">{{ t('dashboard.player') }}: <strong>{{ me?.profile?.battletag|| t('dashboard.guest') }}</strong></p>
				
				<!-- Global Stats -->
				<div class="stats-category">
					<h3 class="category-title">{{ t('dashboard.globalStats') }}</h3>
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

				<!-- Individual Game Stats -->
				<div class="stats-category">
					<h3 class="category-title">{{ t('dashboard.gameStats') }}</h3>
					
					<!-- Hangman Stats -->
					<div class="game-stats-item">
						<h4>🎯 {{ t('dashboard.playHangman') }}</h4>
						<div class="game-stats-grid">
							<div class="stat"><span class="label">{{ t('dashboard.games') }}:</span> <span class="val">{{ game.hangman.gamesPlayed }}</span></div>
							<div class="stat"><span class="label">{{ t('dashboard.wins') }}:</span> <span class="val">{{ game.hangman.wins }}</span></div>
							<div class="stat"><span class="label">{{ t('dashboard.highScore') }}:</span> <span class="val">{{ game.hangman.highScore }}</span></div>
						</div>
					</div>

					<!-- Guess Number Stats -->
					<div class="game-stats-item">
						<h4>🔢 {{ t('dashboard.playGuessNumber') }}</h4>
						<div class="game-stats-grid">
							<div class="stat"><span class="label">{{ t('dashboard.games') }}:</span> <span class="val">{{ game.guessNumber.gamesPlayed }}</span></div>
							<div class="stat"><span class="label">{{ t('dashboard.wins') }}:</span> <span class="val">{{ game.guessNumber.wins }}</span></div>
							<div class="stat"><span class="label">{{ t('dashboard.highScore') }}:</span> <span class="val">{{ game.guessNumber.highScore }}</span></div>
						</div>
					</div>

					<!-- RPS Stats -->
					<div class="game-stats-item">
						<h4>🪨📄✂️ {{ t('dashboard.playRPS') }}</h4>
						<div class="game-stats-grid">
							<div class="stat"><span class="label">{{ t('dashboard.games') }}:</span> <span class="val">{{ game.rps.gamesPlayed }}</span></div>
							<div class="stat"><span class="label">{{ t('dashboard.wins') }}:</span> <span class="val">{{ game.rps.wins }}</span></div>
							<div class="stat"><span class="label">{{ t('dashboard.losses') }}:</span> <span class="val">{{ game.rps.losses }}</span></div>
							<div class="stat"><span class="label">{{ t('dashboard.ties') }}:</span> <span class="val">{{ game.rps.ties }}</span></div>
						</div>
					</div>
				</div>
			</div>

			<div class="play-section">
				<h2>{{ t('dashboard.play') }}</h2>
				<div class="actions">
					<NuxtButton variant="primary" @click.prevent="playGame('hangman')">
						🎯 {{ t('dashboard.playHangman') }}
					</NuxtButton>
					<NuxtButton variant="primary" @click.prevent="playGame('guessnumber')">
						🔢 {{ t('dashboard.playGuessNumber') }}
					</NuxtButton>
					<NuxtButton variant="primary" @click.prevent="playGame('rockpaperscissors')">
						✂️ {{ t('dashboard.playRPS') }}
					</NuxtButton>
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
const { showLoading, hideLoading } = useLoading();

const game = useGameStore();

onMounted(() => {

	// derive user id from profile (if authenticated) and hydrate per-user stats
	try {
		const profile = me.value?.profile
		const userId = profile ? (profile.id || profile.sub || profile.user_id || profile.battletag || null) : null
		const serverStats = stats.data.value?.stats
		game.setUser(userId, serverStats)
	} catch (e) { /* ignore */ }

	try { if (stats && stats.refresh) { stats.refresh() } } catch (e) {}
});

// When another part of the app reports the server-side stats were updated
// (we set `game.lastServerUpdateAt` after a successful POST), refresh server stats
watch(() => game.lastServerUpdateAt, (v, old) => {
	if (v && v !== old) {
		try { if (stats && stats.refresh) { stats.refresh() } } catch (e) {}
		// merge refreshed server stats back into the current user's local store
		try {
			const serverStats = stats.data.value?.stats
			if (serverStats) game.setUser(game.currentUserId, serverStats)
		} catch (e) { /* ignore */ }
	}
});

const playGame = async (gameName) => {
	showLoading(t('dashboard.loadingGame'));
	// Small delay for loading animation
	await new Promise(resolve => setTimeout(resolve, 300));
	await router.push(`/${gameName}`);
	hideLoading();
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

.stats-section, .play-section {
	background: #fff;
	border-radius: 12px;
	padding: 1.5rem;
	box-shadow: 0 8px 24px rgba(0,0,0,0.06);
}

.stats-category {
	margin-top: 2rem;
}

.category-title {
	font-size: 1.2rem;
	color: #667eea;
	margin-bottom: 1rem;
	font-weight: 600;
}

.stats {
	display: flex;
	gap: 2.5rem;
	margin-top: 1.5rem;
	justify-content: center;
	align-items: center;
	flex-wrap: wrap;
}

.game-stats-item {
	background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
	border-radius: 12px;
	padding: 1rem 1.5rem;
	margin-bottom: 1rem;
}

.game-stats-item h4 {
	margin: 0 0 0.75rem 0;
	font-size: 1.1rem;
	color: #2d3748;
}

.game-stats-grid {
	display: grid;
	grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
	gap: 0.75rem;
}

.stat {
	display: flex;
	justify-content: space-between;
	padding: 0.5rem;
	background: rgba(255, 255, 255, 0.7);
	border-radius: 6px;
	font-size: 0.9rem;
}

.stat .label {
	color: #4a5568;
	font-weight: 500;
}

.stat .val {
	color: #1a202c;
	font-weight: 700;
}

.actions {
	display: flex;
	flex-direction: column;
	gap: 1rem;
	margin-top: 1rem;
}

@media (max-width: 800px) {
	.dashboard { 
		grid-template-columns: 1fr; 
	}
	
	.stats {
		gap: 1rem;
	}
	
	.game-stats-grid {
		grid-template-columns: 1fr;
	}
}
</style>

