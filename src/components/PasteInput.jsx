import React, { useState } from "react";

export default function PasteInput({ onTextChange, error }) {
  const [text, setText] = useState("");

  const handleTextChange = (e) => {
    const newText = e.target.value;
    setText(newText);
    onTextChange(newText);
  };

  return (
    <div className="mb-6">
      <label className="block font-bold mb-3 text-gray-800 text-lg">
        Your Playlist
      </label>
      <textarea
        className={`w-full h-32 p-4 border rounded-lg mb-3 resize-none focus:outline-none focus:ring-2 text-gray-700 bg-gray-50 border-gray-300 ${error ? "border-red-500 ring-red-400" : "focus:ring-orange-500 focus:border-orange-500"}`}
        value={text}
        onChange={handleTextChange}
        placeholder={`Blinding Lights - The Weeknd\nSunflower - Post Malone`}
      />
      {error && (
        <div className="text-red-600 font-semibold mb-3">Error: {error}</div>
      )}
    </div>
  );
} 