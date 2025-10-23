import React, { useState, useEffect } from "react";
import PasteInput from "./components/PasteInput";
import WeatherInput from "./components/WeatherInput";
import RecommendationDisplay from "./components/RecommendationDisplay";
import parsePlaylistText from "./utils/parsePlaylistText";
import mapWeatherToMood from "./utils/moodMapper";
import recommendSongs from "./utils/recommendSongs";
import songs from "./data/songs.json";
import { motion } from "framer-motion";
import { FaMusic, FaHeadphones, FaMicrophoneAlt, FaWaveSquare, FaSun, FaBars } from "react-icons/fa";
import MRLogo from "./assets/MRLogo.png";

export default function App() {
  const [playlistText, setPlaylistText] = useState("");
  const [weatherText, setWeatherText] = useState("");
  const [recommendations, setRecommendations] = useState([]);
  const [showSplash, setShowSplash] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 1800);
    return () => clearTimeout(timer);
  }, []);

  const handleFindSongs = () => {
    setError("");
    
    // Validate playlist text
    if (!playlistText.trim()) {
      setError("Please enter your playlist songs.");
      return;
    }
    
    // Check if every non-empty line contains exactly one comma or dash
    const lines = playlistText.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
    const allHaveSeparator = lines.every(line => {
      const commaCount = (line.match(/,/g) || []).length;
      const dashCount = (line.match(/-/g) || []).length;
      return commaCount === 1 || dashCount === 1;
    });
    
    if (!allHaveSeparator) {
      setError("Each line must include exactly one song name and one artist, separated by a comma or dash.");
      return;
    }
    
    // Validate weather text
    if (!weatherText.trim()) {
      setError("Please describe the weather.");
      return;
    }
    
    // Parse playlist and get recommendations
    const parsed = parsePlaylistText(playlistText);
    const mappedMood = mapWeatherToMood(weatherText);
    const newRecommendations = recommendSongs(parsed, mappedMood, songs);
    setRecommendations(newRecommendations);
  };

  // Animation variants for fade-in drop effect
  const dropFadeVariant = {
    hidden: { y: -100, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 1.1,
        ease: "easeOut",
      },
    },
  };

  return (
    <>
      {showSplash && (
        <motion.div
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black" 
          initial={{ opacity: 1 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.img
            src={MRLogo}
            alt="MR Logo"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.9, ease: "easeOut" }}
            className="w-80 h-80 drop-shadow-lg"
          />
        </motion.div>
      )}
      {!showSplash && (
        <div className="min-h-screen relative overflow-hidden font-poppins text-white flex flex-col items-center p-4">
          {/* Full-screen gradient background */}
          <div className="fixed inset-0 w-full h-full bg-gradient-to-r from-orange-200 to-purple-200 -z-10"></div>
          
          {/* Left Sidebar */}
          <div className="hidden md:flex flex-col items-center fixed left-0 top-0 h-full w-16 bg-transparent z-10">
            <FaMusic className="text-white text-3xl mt-12 mb-8 animate-float-slow" />
            <FaHeadphones className="text-white text-2xl mb-8 animate-float-medium" />
            <FaWaveSquare className="text-white text-2xl mb-8 animate-float-fast" />
            <FaMicrophoneAlt className="text-white text-3xl mb-8 animate-float-medium" />
          </div>
          
          {/* Right Sidebar */}
          <div className="hidden md:flex flex-col items-center fixed right-0 top-0 h-full w-16 bg-transparent z-10">
            <FaHeadphones className="text-white text-3xl mt-20 mb-8 animate-float-medium" />
            <FaMusic className="text-white text-2xl mb-8 animate-float-slow" />
            <FaMicrophoneAlt className="text-white text-2xl mb-8 animate-float-fast" />
            <FaWaveSquare className="text-white text-3xl mb-8 animate-float-medium" />
          </div>
          
          {/* Main Content */}
          <div className="w-full max-w-4xl space-y-8 z-20">
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="text-5xl md:text-6xl font-extrabold mb-4 text-center text-white drop-shadow-lg tracking-tight">Find Your Soundtrack</h1>
              <p className="text-base md:text-lg text-black font-medium mb-8 text-center max-w-xl mx-auto">Share your playlist and today's vibe - we'll match the mood.</p>
            </div>
            
            {/* Main Card */}
            <motion.div
              variants={dropFadeVariant}
              initial="hidden"
              animate="visible"
              className="bg-cream rounded-2xl shadow-2xl p-8 max-w-2xl mx-auto"
            >
              <PasteInput onTextChange={setPlaylistText} error={error} />
              <WeatherInput onWeatherChange={setWeatherText} />
              
              {/* Error Display */}
              {error && (
                <div className="text-red-600 font-semibold mb-4 text-center">
                  {error}
                </div>
              )}
              
              {/* Find My Songs Button */}
              <div className="flex justify-end mt-6">
                <button
                  onClick={handleFindSongs}
                  className="bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-lg font-semibold flex items-center gap-2 transition-colors duration-200"
                >
                  Find My Songs
                  <FaBars className="text-white" />
                </button>
              </div>
            </motion.div>
            
            {/* Recommendations */}
            <motion.div
              variants={dropFadeVariant}
              initial="hidden"
              animate="visible"
              transition={{ delay: 0.4, type: "tween", ease: "easeOut" }}
            >
              <RecommendationDisplay recommendations={recommendations} />
            </motion.div>
          </div>
        </div>
      )}
    </>
  );
} 