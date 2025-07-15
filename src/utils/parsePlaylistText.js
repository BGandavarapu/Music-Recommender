export default function parsePlaylistText(text) {
  return text
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean)
    .map(line => {
      // Try to split by comma first
      const [title, artist] = line.split(/\s*,\s*/);
      if (title && artist) {
        return { title: title.trim(), artist: artist.trim() };
      } else {
        // If no artist, just use the whole line as title
        return { title: line, artist: null };
      }
    })
    .filter(Boolean);
} 