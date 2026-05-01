import { FaPlay } from "react-icons/fa";
import type { TrackList } from "../../types/chat";

interface Props {
  trackList: TrackList;
}

export default function TrackListCard({ trackList }: Props) {
  const { title, description, tracks } = trackList;

  return (
    <div className="w-full max-w-2xl rounded-lg overflow-hidden bg-sp-elevated border border-sp-border">
      {/* Header — Spotify-style "PLAYLIST" eyebrow + large title */}
      <div className="px-5 pt-5 pb-4 border-b border-sp-border/60 bg-gradient-to-b from-sp-green/5 to-transparent">
        <div className="text-[10px] tracking-[0.22em] uppercase text-sp-green font-semibold mb-1.5">
          Mix
        </div>
        <h3 className="font-display text-xl sm:text-2xl font-bold text-sp-text tracking-tight leading-tight">
          {title}
        </h3>
        {description && (
          <p className="mt-1.5 text-[13px] text-sp-text-subdued leading-snug">{description}</p>
        )}
        <div className="mt-3 text-[11px] text-sp-text-mute">
          {tracks.length} {tracks.length === 1 ? "track" : "tracks"} · Click any to open in Spotify
        </div>
      </div>

      {/* Track rows */}
      <ul className="max-h-[420px] overflow-y-auto divide-y divide-sp-border/40">
        {tracks.map((t, i) => {
          const num = String(i + 1).padStart(2, "0");
          return (
            <li
              key={i}
              className="group relative flex items-center gap-4 px-4 py-2.5 hover:bg-sp-elevated-hover transition-colors"
            >
              {/* Track number / play button (swap on hover) */}
              <div className="relative w-6 shrink-0 text-center">
                <span className="absolute inset-0 flex items-center justify-center font-mono text-[12px] text-sp-text-mute group-hover:opacity-0 transition-opacity">
                  {num}
                </span>
                {t.spotify_url && (
                  <a
                    href={t.spotify_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={`Play ${t.name} on Spotify`}
                    className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <FaPlay className="text-sp-text text-[10px] ml-0.5" />
                  </a>
                )}
              </div>

              {/* Album art */}
              <div className="w-10 h-10 shrink-0 bg-sp-bg rounded overflow-hidden">
                {t.image_url ? (
                  <img
                    src={t.image_url}
                    alt=""
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full bg-sp-surface" />
                )}
              </div>

              {/* Name + artist */}
              <div className="min-w-0 flex-1">
                {t.spotify_url ? (
                  <a
                    href={t.spotify_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block"
                  >
                    <div className="text-[14px] font-medium text-sp-text truncate group-hover:underline underline-offset-2">
                      {t.name}
                    </div>
                    <div className="text-[12px] text-sp-text-subdued truncate">{t.artist}</div>
                  </a>
                ) : (
                  <>
                    <div className="text-[14px] font-medium text-sp-text truncate">{t.name}</div>
                    <div className="text-[12px] text-sp-text-subdued truncate">{t.artist}</div>
                  </>
                )}
              </div>

              {/* Album name (right-aligned, hidden on small) */}
              <div className="hidden md:block text-[12px] text-sp-text-mute truncate max-w-[180px]">
                {t.album}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
