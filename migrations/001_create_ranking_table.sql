-- +goose up
CREATE TABLE ranking (
    id SERIAL PRIMARY KEY,
    user_battle_tag VARCHAR(255) NOT NULL,
    score INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    difficulty_level INT NOT NULL CHECK (difficulty_level BETWEEN 1 AND 3)
);

-- +goose down
DROP TABLE IF EXISTS ranking;