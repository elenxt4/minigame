import { defineStore } from 'pinia'

export const useGameStore = defineStore('game', {
  state: () => ({
    score: 0,
    highScore: 0,
    wins: 0,
      gamesPlayed: 0,
      // timestamp (ms) updated when server-side stats change so UI can refresh
      lastServerUpdateAt: 0
  }),
  actions: {
    addScore(points: number) {
      this.score += points
      if (this.score > this.highScore) {
        this.highScore = this.score
        this.save()
      }
    },
    resetScore() {
      this.score = 0
    },
    recordWin() {
      this.wins += 1
      this.gamesPlayed += 1
      if (this.score > this.highScore) {
        this.highScore = this.score
      }
      this.save()
    },
    recordLoss() {
      // Called when the player loses a game
      this.gamesPlayed += 1
      this.save()
    },
    // mark that server stats were updated (used to notify dashboard to refresh)
    markServerUpdated() {
      this.lastServerUpdateAt = Date.now()
    },
    load() {
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          const raw = localStorage.getItem('minigame:game')
          if (raw) {
            const json = JSON.parse(raw)
            this.highScore = json.highScore ?? this.highScore
            this.wins = json.wins ?? this.wins
            this.gamesPlayed = json.gamesPlayed ?? this.gamesPlayed
            // keep optional persisted lastScore for UX (not used for highscore logic)
            if (typeof json.lastScore === 'number') this.score = json.lastScore
          }
        }
      } catch (e) {
        // ignore
      }
    },
    save() {
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          localStorage.setItem('minigame:game', JSON.stringify({ highScore: this.highScore, wins: this.wins, gamesPlayed: this.gamesPlayed, lastScore: this.score }))
        }
      } catch (e) {
        // ignore
      }
    }
  }
})
