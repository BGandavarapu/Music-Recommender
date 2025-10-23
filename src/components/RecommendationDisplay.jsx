import React from "react";

export default function RecommendationDisplay({ recommendations }) {
  if (!recommendations || recommendations.length === 0) {
    return (
      <div className="bg-cream p-6 rounded-2xl shadow-lg text-center text-gray-500 max-w-2xl mx-auto">
        No recommendations yet. Paste your playlist and set the weather!
      </div>
    );
  }
  return (
    <div className="grid gap-4 max-w-2xl mx-auto">
      {recommendations.map((song, idx) => (
        <div key={idx} className="bg-cream p-6 rounded-2xl shadow-lg flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <div className="font-bold text-lg text-gray-900">{song.title}</div>
            <div className="text-gray-600 mb-2">{song.artist}</div>
            <div className="flex flex-wrap gap-2 mb-2">
              {song.moods && song.moods.map((mood, i) => (
                <span key={i} className="px-2 py-1 bg-orange-100 text-orange-700 rounded text-xs font-semibold">{mood}</span>
              ))}
            </div>
          </div>
          {song.spotify_url && (
            <a
              href={song.spotify_url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 md:mt-0 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-sm transition-colors duration-200"
            >
              Preview
            </a>
          )}
        </div>
      ))}
    </div>
  );
} 