import React, { useState } from "react";
import { FaSun } from "react-icons/fa";

export default function WeatherInput({ onWeatherChange }) {
  const [weather, setWeather] = useState("");

  const handleWeatherChange = (e) => {
    const newWeather = e.target.value;
    setWeather(newWeather);
    onWeatherChange(newWeather);
  };

  return (
    <div className="mb-6">
      <label className="block font-bold mb-3 text-gray-800 text-lg flex items-center gap-2">
        <FaSun className="text-yellow-500" />
        What's the weather like?
      </label>
      <input
        className="w-full p-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-gray-700 bg-gray-50"
        value={weather}
        onChange={handleWeatherChange}
        placeholder="e.g. sunny and warm"
      />
    </div>
  );
} 