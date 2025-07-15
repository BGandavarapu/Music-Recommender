import React, { useState, useEffect } from "react";
import PasteInput from "./components/PasteInput";
import WeatherInput from "./components/WeatherInput";
import RecommendationDisplay from "./components/RecommendationDisplay";
import parsePlaylistText from "./utils/parsePlaylistText";
import mapWeatherToMood from "./utils/moodMapper";
import recommendSongs from "./utils/recommendSongs";
import songs from "./data/songs.json";
import { motion } from "framer-motion";
import { FaMusic, FaHeadphones, FaMicrophoneAlt, FaWaveSquare } from "react-icons/fa";
import MRLogo from "./assets/MRLogo.png";

export default function App() {
  const [playlist, setPlaylist] = useState([]);
  const [weather, setWeather] = useState("");
  const [mood, setMood] = useState("");
  const [recommendations, setRecommendations] = useState([]);
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 1800);
    return () => clearTimeout(timer);
  }, []);

  const handleAnalyzePlaylist = (playlistText) => {
    const parsed = parsePlaylistText(playlistText);
    setPlaylist(parsed);
    if (mood) {
      setRecommendations(recommendSongs(parsed, mood, songs));
    }
  };

  const handleSetWeather = (weatherText) => {
    setWeather(weatherText);
    const mappedMood = mapWeatherToMood(weatherText);
    setMood(mappedMood);
    if (playlist.length > 0) {
      setRecommendations(recommendSongs(playlist, mappedMood, songs));
    }
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
        <div className="min-h-screen relative overflow-hidden font-poppins text-gray-100 flex flex-col items-center p-4">
          {/* Full-screen gradient background */}
          <div className="fixed inset-0 w-full h-full bg-gradient-to-b from-blue-900/60 to-purple-900/60 -z-10"></div>
          {/* Left Sidebar */}
          <div className="hidden md:flex flex-col items-center fixed left-0 top-0 h-full w-16 bg-transparent z-10">
            <FaMusic className="text-white text-3xl mt-12 mb-8 animate-float-slow" />
            <FaHeadphones className="text-blue-200 text-2xl mb-8 animate-float-medium" />
            <FaWaveSquare className="text-purple-200 text-2xl mb-8 animate-float-fast" />
            <FaMicrophoneAlt className="text-white text-3xl mb-8 animate-float-medium" />
          </div>
          {/* Right Sidebar */}
          <div className="hidden md:flex flex-col items-center fixed right-0 top-0 h-full w-16 bg-transparent z-10">
            <FaHeadphones className="text-white text-3xl mt-20 mb-8 animate-float-medium" />
            <FaMusic className="text-blue-200 text-2xl mb-8 animate-float-slow" />
            <FaMicrophoneAlt className="text-purple-200 text-2xl mb-8 animate-float-fast" />
            <FaWaveSquare className="text-white text-3xl mb-8 animate-float-medium" />
          </div>
          {/* Main Content */}
          <div className="w-full max-w-2xl space-y-8 z-20">
            <h1 className="text-5xl md:text-6xl font-extrabold mb-4 text-center text-indigo-300 drop-shadow-lg tracking-tight">Music Recommender</h1>
            <p className="text-base md:text-lg text-indigo-100 font-bold mb-8 text-center max-w-xl drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">Paste your playlist, enter the weather, and get smart song recommendations powered by AI. Enjoy a personalized music experience!</p>
            <motion.div
              variants={dropFadeVariant}
              initial="hidden"
              animate="visible"
            >
              <PasteInput onAnalyze={handleAnalyzePlaylist} />
            </motion.div>
            <motion.div
              variants={dropFadeVariant}
              initial="hidden"
              animate="visible"
              transition={{ delay: 0.2, type: "tween", ease: "easeOut" }}
            >
              <WeatherInput onSetWeather={handleSetWeather} />
            </motion.div>
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