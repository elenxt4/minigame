interface ScoreData {
  gameId: string;
  userId: string;
  score: number;
}

async function getScore(gameId: string, userId: string): Promise<ScoreData | null> {
  const url = `http://localhost:8080/api/score/${gameId}/${userId}`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Error: ${response.statusText}`);
    }

    const data = (await response.json()) as ScoreData;

    return data;

  } catch (error) {
    console.error("Failed to fetch score:", error);
    return null;
  }
}