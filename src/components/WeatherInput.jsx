import React, { useState } from "react";

export default function WeatherInput({ onSetWeather }) {
  const [weather, setWeather] = useState("");

  return (
    <div className="bg-white p-4 rounded shadow">
      <label className="block font-semibold mb-2 text-gray-800">Describe the weather outside (e.g., 'rainy and cold')</label>
      <input
        className="w-full p-2 border border-blue-400 rounded mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
        value={weather}
        onChange={e => setWeather(e.target.value)}
        placeholder="e.g. sunny and warm"
      />
      <button
        className="mt-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 active:scale-95 active:bg-green-800 transition transform duration-100"
        onClick={() => onSetWeather(weather)}
      >
        Set Weather
      </button>
    </div>
  );
} 