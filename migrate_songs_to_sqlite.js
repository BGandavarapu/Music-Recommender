const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Path to your songs.json
const songsJsonPath = path.join(__dirname, 'src', 'data', 'songs.json');
// Path to your new SQLite database
const dbPath = path.join(__dirname, 'songs.db');

// Read songs.json
const songs = JSON.parse(fs.readFileSync(songsJsonPath, 'utf8'));

// Open (or create) the SQLite database
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  // Create the songs table
  db.run(`
    CREATE TABLE IF NOT EXISTS songs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT,
      artist TEXT,
      genre TEXT,
      mood TEXT,
      weather_type TEXT,
      spotify_url TEXT
    )
  `);

  // Prepare insert statement
  const stmt = db.prepare(`
    INSERT INTO songs (title, artist, genre, mood, weather_type, spotify_url)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  // Insert each song
  songs.forEach(song => {
    const genre = Array.isArray(song.genres) && song.genres.length > 0 ? song.genres[0] : '';
    const mood = Array.isArray(song.moods) && song.moods.length > 0 ? song.moods[0] : '';
    const weather_type = song.weather_type || 'sunny';
    const spotify_url = song.spotify_url || song.previewUrl || '';
    stmt.run(
      song.title || '',
      song.artist || '',
      genre,
      mood,
      weather_type,
      spotify_url
    );
  });

  stmt.finalize();
  console.log('Migration complete! Songs imported into songs.db');
});

db.close(); 