package api

import (
	"database/sql"
	"encoding/json"
	"minigame/internal/db"
	"net/http"

	"github.com/go-chi/chi/v5"
)

func RouteRequest(r chi.Router, dbConn *sql.DB) {
	r.Route("/api", func(r chi.Router) {
		r.Get("/health", func(w http.ResponseWriter, r *http.Request) {
			w.WriteHeader(http.StatusOK)
			w.Write([]byte("OK"))
		})

		r.Get("/rankings", func(w http.ResponseWriter, r *http.Request) {
			rankings, err := db.GetRankings(dbConn)
			if err != nil {
				http.Error(w, "Failed to fetch rankings", http.StatusInternalServerError)
				return
			}

			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(rankings)
		})
	})
}
