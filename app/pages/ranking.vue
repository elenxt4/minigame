<template>
	<div class="ranking-page">
		<div class="ranking-container">
			<h1>🏆 {{ t('ranking.title') }}</h1>
			<p class="subtitle">{{ t('ranking.subtitle') }}</p>
			
			<div v-if="pending" class="loading">
				<LoadingSpinner />
			</div>

			<div v-else-if="error" class="error-message">
				<p>{{ t('ranking.errorLoading') }}</p>
			</div>

			<div v-else class="ranking-content">
				<div class="difficulty-column">
					<h2 class="difficulty-title">Easy</h2>
					<div class="ranking-list">
						<div v-if="rankings?.easy && rankings.easy.length > 0" class="players-list">
							<div v-for="(player, index) in rankings.easy" :key="player.id || index" class="player-item">
								<span class="rank">{{ index + 1 }}</span>
								<span class="player-name">{{ player.name || player.battletag }}</span>
								<span class="player-score">{{ player.score }}</span>
							</div>
						</div>
						<p v-else class="coming-soon">{{ t('ranking.noPlayers') }}</p>
					</div>
				</div>

				<div class="difficulty-column">
					<h2 class="difficulty-title">Medium</h2>
					<div class="ranking-list">
						<div v-if="rankings?.medium && rankings.medium.length > 0" class="players-list">
							<div v-for="(player, index) in rankings.medium" :key="player.id || index" class="player-item">
								<span class="rank">{{ index + 1 }}</span>
								<span class="player-name">{{ player.name || player.battletag }}</span>
								<span class="player-score">{{ player.score }}</span>
							</div>
						</div>
						<p v-else class="coming-soon">{{ t('ranking.noPlayers') }}</p>
					</div>
				</div>

				<div class="difficulty-column">
					<h2 class="difficulty-title">Hard</h2>
					<div class="ranking-list">
						<div v-if="rankings?.hard && rankings.hard.length > 0" class="players-list">
							<div v-for="(player, index) in rankings.hard" :key="player.id || index" class="player-item">
								<span class="rank">{{ index + 1 }}</span>
								<span class="player-name">{{ player.name || player.battletag }}</span>
								<span class="player-score">{{ player.score }}</span>
							</div>
						</div>
						<p v-else class="coming-soon">{{ t('ranking.noPlayers') }}</p>
					</div>
				</div>
			</div>

			<div class="back-button">
				<NuxtButton variant="secondary" @click.prevent="goBack">
					← {{ t('ranking.backToDashboard') }}
				</NuxtButton>
			</div>
		</div>
	</div>
</template>

<script setup>
import { useI18n } from 'vue-i18n';
import { useRouter } from '#imports';
import { useFetch } from '#imports';
import NuxtButton from '../components/NuxtButton.vue';
import LoadingSpinner from '../components/LoadingSpinner.vue';

const { t } = useI18n();
const router = useRouter();

// Fetch rankings from API
const { data: rankings, pending, error } = await useFetch('/api/rankings');

const goBack = () => {
	router.push('/dashboard');
};
</script>

<style scoped>
.ranking-page {
	display: flex;
	align-items: center;
	justify-content: center;
	min-height: 80vh;
	padding: 2rem;
}

.ranking-container {
	background: #fff;
	border-radius: 12px;
	padding: 3rem;
	box-shadow: 0 8px 24px rgba(0,0,0,0.06);
	width: 100%;
	max-width: 900px;
	text-align: center;
}

h1 {
	font-size: 2.5rem;
	color: #667eea;
	margin-bottom: 0.5rem;
}

.subtitle {
	font-size: 1.1rem;
	color: #4a5568;
	margin-bottom: 2rem;
}

.ranking-content {
	display: grid;
	grid-template-columns: repeat(3, 1fr);
	gap: 1.5rem;
	margin-bottom: 2rem;
}

.difficulty-column {
	background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
	border-radius: 12px;
	padding: 1.5rem;
	min-height: 400px;
	display: flex;
	flex-direction: column;
}

.difficulty-title {
	font-size: 1.5rem;
	color: #2d3748;
	margin-bottom: 1rem;
	text-align: center;
	font-weight: 600;
}

.ranking-list {
	flex: 1;
	display: flex;
	flex-direction: column;
	overflow-y: auto;
}

.players-list {
	width: 100%;
}

.player-item {
	display: grid;
	grid-template-columns: 40px 1fr 80px;
	gap: 0.5rem;
	align-items: center;
	padding: 0.75rem;
	margin-bottom: 0.5rem;
	background: rgba(255, 255, 255, 0.8);
	border-radius: 8px;
	transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.player-item:hover {
	transform: translateX(5px);
	box-shadow: 0 4px 12px rgba(102, 126, 234, 0.2);
}

.rank {
	font-weight: 700;
	font-size: 1.2rem;
	color: #667eea;
	text-align: center;
}

.player-name {
	font-weight: 600;
	color: #2d3748;
	text-align: left;
	overflow: hidden;
	text-overflow: ellipsis;
	white-space: nowrap;
}

.player-score {
	font-weight: 700;
	color: #48bb78;
	text-align: right;
}

.coming-soon {
	font-size: 1rem;
	color: #4a5568;
	font-style: italic;
	text-align: center;
	width: 100%;
}

.loading {
	display: flex;
	align-items: center;
	justify-content: center;
	min-height: 400px;
}

.error-message {
	padding: 2rem;
	background: #fee;
	border-radius: 12px;
	color: #c53030;
	margin-bottom: 2rem;
}

.back-button {
	display: flex;
	justify-content: center;
}

@media (max-width: 800px) {
	.ranking-container {
		padding: 2rem 1rem;
	}
	
	.ranking-content {
		grid-template-columns: 1fr;
	}
	
	.difficulty-column {
		min-height: 300px;
	}
	
	h1 {
		font-size: 2rem;
	}
	
	.subtitle {
		font-size: 1rem;
	}
	
	.difficulty-title {
		font-size: 1.3rem;
	}
	
	.coming-soon {
		font-size: 0.9rem;
	}
}
</style>
