import React from "react";

export default function RecommendationDisplay({ recommendations }) {
  if (!recommendations || recommendations.length === 0) {
    return (
      <div className="bg-white p-4 rounded shadow text-center text-gray-500">
        No recommendations yet. Paste your playlist and set the weather!
      </div>
    );
  }
  return (
    <div className="grid gap-4">
      {recommendations.map((song, idx) => (
        <div key={idx} className="bg-white p-4 rounded shadow flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <div className="font-bold text-lg text-gray-900">{song.title}</div>
            <div className="text-gray-600 mb-2">{song.artist}</div>
            <div className="flex flex-wrap gap-2 mb-2">
              {song.moods && song.moods.map((mood, i) => (
                <span key={i} className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs font-semibold">{mood}</span>
              ))}
            </div>
          </div>
          {song.spotify_url && (
            <a
              href={song.spotify_url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 md:mt-0 px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 text-sm"
            >
              Preview
            </a>
          )}
        </div>
      ))}
    </div>
  );
} 