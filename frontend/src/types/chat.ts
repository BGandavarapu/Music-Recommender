export type Role = "user" | "assistant";

export interface TrackCard {
  name: string;
  artist: string;
  album: string;
  image_url: string | null;
  spotify_url: string;
}

export interface TrackList {
  title: string;
  description?: string;
  tracks: TrackCard[];
}

export interface ToolStatus {
  tool: string;
  status: "running" | "done" | "error";
  message?: string;
}

export interface Message {
  id: string;
  role: Role;
  text: string;
  streaming?: boolean;
  toolStatuses?: ToolStatus[];
  trackList?: TrackList;
}
