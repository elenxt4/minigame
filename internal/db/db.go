package db

import (
	"database/sql"
	"fmt"
	"os"
	"time"

	_ "github.com/lib/pq"
)

type Ranking struct {
	Id              int       `json:"id"`
	BattleTag       string    `json:"battle_tag"`
	Score           int       `json:"score"`
	DifficultyLevel int       `json:"difficulty_level"`
	DateGame        time.Time `json:"date_game"`
}

func Connect() (*sql.DB, error) {
	return sql.Open("postgres", os.Getenv("DATABASE_URL"))
}

func GetRankings(dbConn *sql.DB) ([]Ranking, error) {
	rows, err := dbConn.Query(`
		SELECT id, user_battle_tag, score, difficulty_level, created_at
		FROM ranking
		ORDER BY score DESC, created_at ASC`)
	if err != nil {
		fmt.Println("Error querying rankings:", err)
		return nil, err
	}
	defer rows.Close()

	var rankings []Ranking
	for rows.Next() {
		var r Ranking
		if err := rows.Scan(&r.Id, &r.BattleTag, &r.Score, &r.DifficultyLevel, &r.DateGame); err != nil {
			fmt.Println("Error scanning ranking:", err)
			return nil, err
		}
		rankings = append(rankings, r)
	}
	return rankings, nil
}
