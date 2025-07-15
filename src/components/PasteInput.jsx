import React, { useState } from "react";

export default function PasteInput({ onAnalyze }) {
  const [text, setText] = useState("");
  const [error, setError] = useState("");

  const handleAnalyze = () => {
    // Check if every non-empty line contains exactly one comma
    const lines = text.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
    const allHaveOneComma = lines.every(line => (line.match(/,/g) || []).length === 1);
    if (!allHaveOneComma) {
      setError("Each line must include exactly one song name and one artist, separated by a single comma.");
      return;
    }
    setError("");
    onAnalyze(text);
  };

  return (
    <div className="bg-white p-4 rounded shadow">
      <label className="block font-semibold mb-2 text-gray-800">
        Paste your playlist (one per line, <span className="text-red-600">Song Name, Artist</span>)
      </label>
      <textarea
        className={`w-full h-32 p-2 border rounded mb-2 resize-none focus:outline-none focus:ring-2 text-black ${error ? "border-red-500 ring-red-400" : "border-blue-400 focus:ring-blue-500"}`}
        value={text}
        onChange={e => { setText(e.target.value); setError(""); }}
        placeholder={`Blinding Lights, The Weeknd\nSunflower, Post Malone`}
      />
      {error && (
        <div className="text-red-600 font-semibold mb-2">Error: {error}</div>
      )}
      <button
        className="mt-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 active:scale-95 active:bg-blue-800 transition transform duration-100"
        onClick={handleAnalyze}
      >
        Analyze Playlist
      </button>
    </div>
  );
} 