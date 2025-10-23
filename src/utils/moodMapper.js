const weatherMoodMap = [
  { keywords: ["rain", "rainy", "drizzle", "storm"], mood: "rainy" },
  { keywords: ["sun", "sunny", "clear", "bright"], mood: "sunny" },
  { keywords: ["cloud", "cloudy", "overcast"], mood: "cloudy" },
  { keywords: ["snow", "snowy", "blizzard"], mood: "snowy" },
  { keywords: ["fog", "foggy", "mist"], mood: "foggy" },
  { keywords: ["cold", "chill", "freezing"], mood: "chill" },
  { keywords: ["hot", "warm", "heat"], mood: "upbeat" },
  { keywords: ["wind", "windy", "breeze"], mood: "energetic" },
  { keywords: ["storm", "stormy", "thunder"], mood: "stormy" },
  { keywords: ["cozy"], mood: "cozy" },
  { keywords: ["night", "late"], mood: "night drive" },
];

// Levenshtein distance implementation
function levenshtein(a, b) {
  const matrix = Array.from({ length: a.length + 1 }, (_, i) => [i]);
  for (let j = 1; j <= b.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      if (a[i - 1] === b[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1, // deletion
          matrix[i][j - 1] + 1, // insertion
          matrix[i - 1][j - 1] + 1 // substitution
        );
      }
    }
  }
  return matrix[a.length][b.length];
}

export default function mapWeatherToMood(weatherText) {
  const lower = weatherText.toLowerCase();
  // First, try exact keyword match
  for (const { keywords, mood } of weatherMoodMap) {
    if (keywords.some(k => lower.includes(k))) {
      console.log(`[MoodMapper] Weather input: '${weatherText}' mapped to mood: '${mood}' (exact match)`);
      return mood;
    }
  }
  // Fuzzy match: check each word in input against all keywords
  const words = lower.split(/\W+/);
  let best = { mood: null, dist: Infinity };
  for (const { keywords, mood } of weatherMoodMap) {
    for (const k of keywords) {
      for (const w of words) {
        const dist = levenshtein(w, k);
        if (dist < best.dist) {
          best = { mood, dist };
        }
      }
    }
  }
  if (best.dist <= 2) {
    console.log(`[MoodMapper] Weather input: '${weatherText}' mapped to mood: '${best.mood}' (fuzzy match, dist=${best.dist})`);
    return best.mood;
  }
  console.log(`[MoodMapper] Weather input: '${weatherText}' mapped to default mood: 'chill'`);
  return "chill"; // default mood
} 