import { defineStore } from 'pinia'

export const useGameStore = defineStore('game', {
  state: () => ({
    // Global stats
    score: 0,
    highScore: 0,
    wins: 0,
    gamesPlayed: 0,
    // Individual game stats
    hangman: {
      gamesPlayed: 0,
      wins: 0,
      highScore: 0,
      currentScore: 0
    },
    guessNumber: {
      gamesPlayed: 0,
      wins: 0,
      highScore: 0,
      currentScore: 0
    },
    rps: {
      gamesPlayed: 0,
      wins: 0,
      losses: 0,
      ties: 0,
      highScore: 0,
      currentScore: 0
    },
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
    // Individual game actions
    recordGameResult(gameName: 'hangman' | 'guessNumber' | 'rps', result: { won: boolean, points: number, isLoss?: boolean, isTie?: boolean }) {
      const game = this[gameName]
      
      // Update game-specific stats
      game.gamesPlayed++
      game.currentScore = result.points
      
      if (result.won) {
        game.wins++
        if (result.points > game.highScore) {
          game.highScore = result.points
        }
      }
      
      // RPS specific stats
      if (gameName === 'rps') {
        if (result.isLoss) {
          this.rps.losses++
        } else if (result.isTie) {
          this.rps.ties++
        }
      }
      
      // Update global stats
      this.gamesPlayed++
      if (result.won) {
        this.wins++
      }
      this.score += result.points
      if (this.score > this.highScore) {
        this.highScore = this.score
      }
      
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
            // Global stats
            this.highScore = json.highScore ?? this.highScore
            this.wins = json.wins ?? this.wins
            this.gamesPlayed = json.gamesPlayed ?? this.gamesPlayed
            if (typeof json.lastScore === 'number') this.score = json.lastScore
            
            // Individual game stats
            if (json.hangman) {
              this.hangman = { ...this.hangman, ...json.hangman }
            }
            if (json.guessNumber) {
              this.guessNumber = { ...this.guessNumber, ...json.guessNumber }
            }
            if (json.rps) {
              this.rps = { ...this.rps, ...json.rps }
            }
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
          localStorage.setItem(key, JSON.stringify({ 
            highScore: this.highScore, 
            wins: this.wins, 
            gamesPlayed: this.gamesPlayed, 
            lastScore: this.score,
            hangman: this.hangman,
            guessNumber: this.guessNumber,
            rps: this.rps
          }))
        }
      } catch (e) {
        // ignore
      }
    }
  }
})
