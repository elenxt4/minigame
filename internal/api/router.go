package api

import (
	"database/sql"
	"encoding/json"
	"minigame/internal/db"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
)

type BodyRequest struct {
	BattleTag       string `json:"battle_tag"`
	Score           int    `json:"score"`
	DifficultyLevel int    `json:"difficulty_level"`
}

func RouteRequest(r chi.Router, dbConn *sql.DB) {
	r.Route("/api", func(r chi.Router) {
		r.Get("/health", func(w http.ResponseWriter, r *http.Request) {
			w.WriteHeader(http.StatusOK)
			w.Write([]byte("OK"))
		})

		r.Get("/rankings/{difficulty}", func(w http.ResponseWriter, r *http.Request) {
			difficulty := chi.URLParam(r, "difficulty")
			difficultyInt, err := strconv.Atoi(difficulty)
			if err != nil {
				http.Error(w, "Invalid difficulty parameter", http.StatusBadRequest)
				return
			}

			rankings, err := db.GetRankings(dbConn, difficultyInt)
			if err != nil {
				http.Error(w, "Failed to fetch rankings", http.StatusInternalServerError)
				return
			}

			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(rankings)
		})
		r.Post("/rankings", func(w http.ResponseWriter, r *http.Request) {
			var ranking BodyRequest
			if err := json.NewDecoder(r.Body).Decode(&ranking); err != nil {
				http.Error(w, "Invalid request body", http.StatusBadRequest)
				return
			}

			err := db.AddRanking(dbConn, ranking.BattleTag, ranking.Score, ranking.DifficultyLevel)
			if err != nil {
				http.Error(w, "Failed to insert ranking", http.StatusInternalServerError)
				return
			}

			w.WriteHeader(http.StatusCreated)
		})

	})
}
