function levenshtein(a, b) {
  if (!a || !b) return Math.max((a || '').length, (b || '').length);
  const matrix = Array.from({ length: a.length + 1 }, (_, i) => [i]);
  for (let j = 1; j <= b.length; j++) matrix[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      if (a[i - 1] === b[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j - 1] + 1
        );
      }
    }
  }
  return matrix[a.length][b.length];
}

export default function recommendSongs(playlist, mood, songs) {
  // Build sets for quick lookup (case-insensitive)
  const playlistArtists = new Set(
    playlist
      .map(s => (s.artist ? s.artist.toLowerCase() : null))
      .filter(Boolean)
  );
  const playlistTitles = new Set(
    playlist
      .map(s => (s.title ? s.title.toLowerCase() : null))
      .filter(Boolean)
  );
  const playlistTitlesArr = playlist
    .map(s => (s.title ? s.title.toLowerCase() : null))
    .filter(Boolean);
  const playlistArtistsArr = playlist
    .map(s => (s.artist ? s.artist.toLowerCase() : null))
    .filter(Boolean);

  // Score each song
  const scored = songs.map(song => {
    let score = 0;
    // Artist match (case-insensitive, only if artist is provided)
    let artistMatch = false;
    if (song.artist && playlistArtists.has(song.artist.toLowerCase())) {
      score += 3;
      artistMatch = true;
    } else if (song.artist) {
      // Fuzzy artist match (allow typos, case-insensitive)
      for (const inputArtist of playlistArtistsArr) {
        if (levenshtein(song.artist.toLowerCase(), inputArtist) <= 2) {
          score += 2; // Smaller bonus for fuzzy match
          break;
        }
      }
    }
    // Title match (case-insensitive, avoid recommending the same song)
    let exactTitleMatch = false;
    if (song.title && playlistTitles.has(song.title.toLowerCase())) {
      score -= 5;
      exactTitleMatch = true;
    }
    // Fuzzy and partial title match (allow typos and partials, but not if exact match already found)
    if (!exactTitleMatch && song.title) {
      for (const inputTitle of playlistTitlesArr) {
        // Partial match: user input is contained in song title or vice versa
        if (
          song.title.toLowerCase().includes(inputTitle) ||
          inputTitle.includes(song.title.toLowerCase())
        ) {
          score -= 3; // Penalize, but less than exact or fuzzy match
          break;
        }
        // Fuzzy match
        if (levenshtein(song.title.toLowerCase(), inputTitle) <= 2) {
          score -= 4; // Penalize, but less than exact match
          break;
        }
      }
    }
    // If user did not provide artist, still match by title (case-insensitive, fuzzy, partial)
    for (const pl of playlist) {
      if (!pl.artist && pl.title && song.title) {
        if (song.title.toLowerCase() === pl.title.toLowerCase()) {
          score -= 5;
        } else if (
          song.title.toLowerCase().includes(pl.title.toLowerCase()) ||
          pl.title.toLowerCase().includes(song.title.toLowerCase())
        ) {
          score -= 3;
        } else if (levenshtein(song.title.toLowerCase(), pl.title.toLowerCase()) <= 2) {
          score -= 4;
        }
      }
    }
    // Mood match
    if (song.moods && song.moods.map(m => m.toLowerCase()).includes(mood.toLowerCase())) score += 3;
    // Genre overlap
    for (const pl of playlist) {
      if (pl.title && pl.artist) {
        // Fuzzy genre match (case-insensitive)
        if (
          song.genres &&
          song.genres.some(
            g =>
              pl.title.toLowerCase().includes(g.toLowerCase()) ||
              pl.artist.toLowerCase().includes(g.toLowerCase())
          )
        ) {
          score += 1;
        }
      }
    }
    // Bonus for multiple mood overlaps (case-insensitive)
    if (song.moods) {
      score += song.moods.filter(m => m.toLowerCase() === mood.toLowerCase()).length;
    }
    return { ...song, _score: score };
  });

  // --- Strict mood filtering: Only recommend songs that match the mood if any exist ---
  const moodMatches = scored.filter(song =>
    song.moods && song.moods.map(m => m.toLowerCase()).includes(mood.toLowerCase())
  );
  if (moodMatches.length > 0) {
    // Sort by score, then randomize within same score
    moodMatches.sort((a, b) => b._score - a._score || Math.random() - 0.5);
    return moodMatches.slice(0, 10);
  }

  // Fallback: original logic
  scored.sort((a, b) => b._score - a._score || Math.random() - 0.5);
  const positive = scored.filter(s => s._score > 0);
  if (positive.length >= 5) {
    return positive.slice(0, 10);
  } else {
    const needed = 5 - positive.length;
    const filler = scored.filter(s => s._score <= 0).slice(0, needed);
    return [...positive, ...filler].slice(0, 10);
  }
} 