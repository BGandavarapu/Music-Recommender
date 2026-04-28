export type Tempo = "slow" | "mid" | "fast";

export interface Song {
  id?: number;
  title: string;
  artist: string;
  genres: string[];
  moods: string[];
  tempo: Tempo;
  weather_type: string;
  spotify_url: string;
}

export interface PlaylistEntry {
  title: string;
  artist: string | null;
}
