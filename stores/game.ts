import { defineStore } from 'pinia'

export const useGameStore = defineStore('game', {
  state: () => ({
    score: 0,
    highScore: 0,
    wins: 0,
      gamesPlayed: 0,
      // timestamp (ms) updated when server-side stats change so UI can refresh
      lastServerUpdateAt: 0,
      // tracked current user id (battlenet id / battletag) to isolate local storage per user
      currentUserId: null as string | null
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
    // Set/Change current user and hydrate from local storage + optionally merge server stats
    setUser(userId: string | null, serverStats?: { gamesPlayed: number; wins: number; highScore: number }) {
      this.currentUserId = userId || 'guest'
      // load local stats for this user id
      this.load()
      if (serverStats) {
        // prefer server authoritative counts, but keep local highScore if higher
        this.gamesPlayed = serverStats.gamesPlayed
        this.wins = serverStats.wins
        if (serverStats.highScore > this.highScore) {
          this.highScore = serverStats.highScore
        }
        this.save()
      }
    },
    load() {
      try {
        if (typeof window !== 'undefined' && window.localStorage) {
          const key = `minigame:game:${this.currentUserId || 'guest'}`
          const raw = localStorage.getItem(key)
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
          const key = `minigame:game:${this.currentUserId || 'guest'}`
          localStorage.setItem(key, JSON.stringify({ highScore: this.highScore, wins: this.wins, gamesPlayed: this.gamesPlayed, lastScore: this.score }))
        }
      } catch (e) {
        // ignore
      }
    }
  }
})
