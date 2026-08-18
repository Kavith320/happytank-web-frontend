"use client";

import React, { useState, useEffect, useMemo } from "react";

export default function AquariumBackground({
  showSeabed = true,
  density = "normal",
  subtle = false,
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Generate background bubbles on client mount only
  const bubbleCount = density === "dense" ? 22 : density === "sparse" ? 8 : 14;
  const bubbles = useMemo(() => {
    if (!mounted) return [];
    return Array.from({ length: bubbleCount }).map((_, i) => ({
      id: i,
      size: Math.floor(Math.random() * 20) + 8,
      left: `${(i * (100 / bubbleCount) + Math.random() * 4).toFixed(1)}%`,
      duration: `${(Math.random() * 6 + 8).toFixed(1)}s`,
      delay: `${(Math.random() * 5).toFixed(1)}s`,
    }));
  }, [bubbleCount, mounted]);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 select-none">
      {/* 🌊 Deep Ocean Gradient Base */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#020b14] via-[#04192d] to-[#010912]" />

      {/* ☀️ Caustic Shimmering Sunbeams */}
      <div
        className={`absolute -top-32 left-1/2 -translate-x-1/2 w-[140vw] h-[70vh] transition-opacity duration-700 ${
          subtle ? "opacity-10" : "opacity-25"
        }`}
        style={{
          background:
            "radial-gradient(ellipse at center top, rgba(34, 211, 238, 0.35) 0%, rgba(6, 182, 212, 0.1) 45%, transparent 75%)",
          animation: "causticShimmer 10s ease-in-out infinite",
        }}
      />
      <div
        className={`absolute -top-20 left-1/4 w-[90vw] h-[50vh] transition-opacity duration-700 ${
          subtle ? "opacity-10" : "opacity-20"
        }`}
        style={{
          background:
            "radial-gradient(ellipse at center top, rgba(20, 184, 166, 0.3) 0%, transparent 65%)",
          animation: "causticShimmer 14s ease-in-out infinite 3s",
        }}
      />

      {/* 🫧 Ambient Rising Bubbles */}
      {bubbles.map((b) => (
        <div
          key={b.id}
          className="animate-bubble"
          style={{
            width: `${b.size}px`,
            height: `${b.size}px`,
            left: b.left,
            animationDuration: b.duration,
            animationDelay: b.delay,
            opacity: subtle ? 0.35 : 0.65,
          }}
        />
      ))}

      {/* 🌊 DIVERSE AQUATIC ECOSYSTEM (Bigger sizes & Natural Physics Roaming) 🌊 */}
      <div className={`transition-opacity duration-700 ${subtle ? "opacity-45" : "opacity-90"}`}>
        
        {/* 1. 🌊 Giant Majestic Manta Ray (Gliding with wing flap cycle) */}
        <div
          className="absolute top-[16%]"
          style={{
            animation: "mantaRoam 38s linear infinite 2s",
          }}
        >
          <div
            style={{
              animation: "mantaWingFlap 3.5s ease-in-out infinite",
              transformOrigin: "center center",
            }}
          >
            <svg width="150" height="90" viewBox="0 0 150 90" className="drop-shadow-2xl" fill="none">
              {/* Long Whiptail */}
              <path
                d="M45 45 Q20 46 2 48"
                stroke="#38bdf8"
                strokeWidth="2.5"
                strokeLinecap="round"
                opacity="0.85"
              />
              <path
                d="M45 45 Q20 44 2 42"
                stroke="#0284c7"
                strokeWidth="1.5"
                strokeLinecap="round"
                opacity="0.6"
              />
              {/* Main Diamond Wing Body */}
              <path
                d="M135 45 C125 30, 85 5, 55 12 C40 18, 42 38, 48 45 C42 52, 40 72, 55 78 C85 85, 125 60, 135 45 Z"
                fill="url(#mantaGrad)"
                stroke="#0284c7"
                strokeWidth="1.5"
              />
              {/* Cephalic Horns/Fins */}
              <path d="M135 40 C145 36, 148 42, 142 45 Z" fill="#0284c7" />
              <path d="M135 50 C145 54, 148 48, 142 45 Z" fill="#0284c7" />
              {/* Dorsal Glow Markings */}
              <path
                d="M80 32 Q95 45 80 58"
                stroke="rgba(103, 232, 249, 0.7)"
                strokeWidth="2.5"
                strokeLinecap="round"
                fill="none"
              />
              <path
                d="M65 35 Q76 45 65 55"
                stroke="rgba(103, 232, 249, 0.5)"
                strokeWidth="2"
                strokeLinecap="round"
                fill="none"
              />
              <circle cx="120" cy="38" r="2.5" fill="#e0f2fe" />
              <circle cx="120" cy="52" r="2.5" fill="#e0f2fe" />
              <defs>
                <linearGradient id="mantaGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#082f49" />
                  <stop offset="40%" stopColor="#0369a1" />
                  <stop offset="80%" stopColor="#0284c7" />
                  <stop offset="100%" stopColor="#38bdf8" />
                </linearGradient>
              </defs>
            </svg>
          </div>
        </div>

        {/* 2. 🐢 Ancient Gentle Sea Turtle (Swimming Diagonally with Rowing Flippers) */}
        <div
          className="absolute top-[65%]"
          style={{
            animation: "turtleRoam 42s linear infinite 8s",
          }}
        >
          <svg width="125" height="85" viewBox="0 0 125 85" className="drop-shadow-2xl" fill="none">
            {/* Front Flippers (Rowing Stroke) */}
            <path
              d="M48 25 C35 5, 15 10, 26 30 Z"
              fill="#10b981"
              stroke="#047857"
              strokeWidth="1.5"
              style={{
                transformOrigin: "48px 25px",
                animation: "turtleFlipper 2.5s ease-in-out infinite",
              }}
            />
            <path
              d="M48 60 C35 80, 15 75, 26 55 Z"
              fill="#059669"
              stroke="#047857"
              strokeWidth="1.5"
              style={{
                transformOrigin: "48px 60px",
                animation: "turtleFlipper 2.5s ease-in-out infinite 0.3s",
              }}
            />
            {/* Hind Flippers */}
            <path d="M85 28 C95 18, 105 22, 98 34 Z" fill="#059669" />
            <path d="M85 57 C95 67, 105 63, 98 51 Z" fill="#047857" />
            {/* Head & Neck */}
            <ellipse cx="20" cy="42" rx="10" ry="7" fill="#10b981" stroke="#047857" strokeWidth="1.5" />
            <circle cx="16" cy="39" r="2" fill="#022c22" />
            {/* Shell (Carapace) */}
            <ellipse
              cx="65"
              cy="42"
              rx="32"
              ry="24"
              fill="#065f46"
              stroke="#047857"
              strokeWidth="2"
            />
            {/* Shell Scute Patterns */}
            <path
              d="M50 42 L60 30 L75 30 L85 42 L75 54 L60 54 Z"
              fill="#047857"
              stroke="#34d399"
              strokeWidth="1.5"
            />
            <path
              d="M60 30 L65 20 M75 30 L80 20 M85 42 L95 42 M75 54 L80 64 M60 54 L65 64 M50 42 L38 42"
              stroke="#34d399"
              strokeWidth="1.2"
            />
          </svg>
        </div>

        {/* 3. 🐠 Large Ocellaris Clownfish (Upper Level, Swimming Right to Left with Pitch & Buoyancy) */}
        <div
          className="absolute top-[26%]"
          style={{
            animation: "fishNaturalLeft 26s ease-in-out infinite 0s",
          }}
        >
          <svg width="105" height="65" viewBox="0 0 105 65" className="drop-shadow-xl" fill="none">
            {/* Wiggling Tail Fin */}
            <path
              d="M80 32 C96 14, 103 12, 104 18 C101 32, 101 32, 104 46 C103 52, 96 50, 80 32 Z"
              fill="#ea580c"
              stroke="#1c1917"
              strokeWidth="2"
              style={{
                transformOrigin: "80px 32px",
                animation: "tailWiggle 0.4s ease-in-out infinite",
              }}
            />
            {/* Dorsal & Ventral Fins */}
            <path d="M42 12 C58 8, 72 14, 76 22 Z" fill="#ea580c" stroke="#1c1917" strokeWidth="1.5" />
            <path d="M48 52 C60 56, 70 52, 74 42 Z" fill="#ea580c" stroke="#1c1917" strokeWidth="1.5" />
            {/* Body */}
            <path
              d="M15 32 C18 16, 50 8, 80 22 C84 32, 84 32, 80 42 C50 56, 18 48, 15 32 Z"
              fill="#f97316"
              stroke="#1c1917"
              strokeWidth="2"
            />
            {/* White Bands with black borders */}
            <path
              d="M34 13 C38 22, 38 42, 34 51 C29 48, 29 16, 34 13 Z"
              fill="#ffffff"
              stroke="#1c1917"
              strokeWidth="1.5"
            />
            <path
              d="M56 11 C61 22, 61 42, 56 53 C51 51, 51 13, 56 11 Z"
              fill="#ffffff"
              stroke="#1c1917"
              strokeWidth="1.5"
            />
            <path
              d="M74 20 C77 26, 77 38, 74 44 C71 43, 71 21, 74 20 Z"
              fill="#ffffff"
              stroke="#1c1917"
              strokeWidth="1.5"
            />
            {/* Eye */}
            <circle cx="25" cy="27" r="5.5" fill="#ffffff" stroke="#1c1917" strokeWidth="1" />
            <circle cx="24" cy="27" r="2.8" fill="#0f172a" />
            <circle cx="23" cy="25.5" r="1" fill="#ffffff" />
            {/* Pectoral Fin Flutter */}
            <ellipse
              cx="40"
              cy="36"
              rx="8"
              ry="5"
              fill="#ea580c"
              stroke="#1c1917"
              strokeWidth="1.5"
              style={{
                transformOrigin: "36px 36px",
                animation: "tailWiggleFast 0.3s ease-in-out infinite",
              }}
            />
          </svg>
        </div>

        {/* 4. 🐟 Large Royal Blue Tang / Dory (Mid Level, Swimming Left to Right) */}
        <div
          className="absolute top-[46%]"
          style={{
            animation: "fishNaturalRight 32s ease-in-out infinite 6s",
          }}
        >
          <svg width="118" height="72" viewBox="0 0 118 72" className="drop-shadow-xl" fill="none">
            {/* Tail */}
            <path
              d="M90 36 C105 18, 115 14, 116 22 C113 36, 113 36, 116 50 C115 58, 105 54, 90 36 Z"
              fill="#facc15"
              stroke="#1e293b"
              strokeWidth="2"
              style={{
                transformOrigin: "90px 36px",
                animation: "tailWiggle 0.45s ease-in-out infinite",
              }}
            />
            {/* Dorsal & Pelvic Fin */}
            <path d="M45 10 C68 6, 85 16, 90 26 Z" fill="#1d4ed8" stroke="#1e293b" strokeWidth="1.5" />
            <path d="M45 62 C68 66, 85 56, 90 46 Z" fill="#1d4ed8" stroke="#1e293b" strokeWidth="1.5" />
            {/* Main Body */}
            <path
              d="M15 36 C22 12, 60 5, 90 24 C96 36, 96 36, 90 48 C60 67, 22 60, 15 36 Z"
              fill="#2563eb"
              stroke="#1e293b"
              strokeWidth="2"
            />
            {/* Black Curved Palette Markings */}
            <path
              d="M40 16 C60 18, 78 28, 84 40 C72 44, 52 34, 44 38 C38 42, 30 34, 40 16 Z"
              fill="#0f172a"
            />
            <path d="M78 30 L90 24 L90 48 L78 42 Z" fill="#facc15" />
            {/* Eye */}
            <circle cx="28" cy="30" r="6" fill="#ffffff" stroke="#1e293b" strokeWidth="1" />
            <circle cx="27" cy="30" r="3" fill="#0f172a" />
            <circle cx="25.5" cy="28.5" r="1.2" fill="#ffffff" />
            {/* Pectoral Fin */}
            <ellipse
              cx="46"
              cy="42"
              rx="9"
              ry="5.5"
              fill="#3b82f6"
              stroke="#1e293b"
              strokeWidth="1.5"
              style={{
                transformOrigin: "42px 42px",
                animation: "tailWiggleFast 0.35s ease-in-out infinite",
              }}
            />
          </svg>
        </div>

        {/* 5. 🐠 Golden Queen Angelfish (Deep Mid Level, Graceful Cruise) */}
        <div
          className="absolute top-[35%]"
          style={{
            animation: "angelfishRoam 34s ease-in-out infinite 14s",
          }}
        >
          <svg width="110" height="90" viewBox="0 0 110 90" className="drop-shadow-xl" fill="none">
            {/* Tall Crown Fin */}
            <path d="M40 10 C55 2, 75 12, 85 30 Z" fill="#f59e0b" stroke="#b45309" strokeWidth="1.5" />
            <path d="M40 80 C55 88, 75 78, 85 60 Z" fill="#f59e0b" stroke="#b45309" strokeWidth="1.5" />
            {/* Tail */}
            <path
              d="M85 45 C98 32, 105 30, 106 35 C104 45, 104 45, 106 55 C105 60, 98 58, 85 45 Z"
              fill="#fbbf24"
              stroke="#b45309"
              strokeWidth="1.5"
              style={{
                transformOrigin: "85px 45px",
                animation: "tailWiggle 0.4s ease-in-out infinite",
              }}
            />
            {/* Diamond Body */}
            <path
              d="M15 45 C22 20, 60 14, 85 32 C90 45, 90 45, 85 58 C60 76, 22 70, 15 45 Z"
              fill="url(#angelGrad)"
              stroke="#b45309"
              strokeWidth="2"
            />
            {/* Neon Blue Vertical Stripes */}
            <path d="M38 25 Q42 45 38 65" stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M55 20 Q60 45 55 70" stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round" />
            <path d="M72 26 Q76 45 72 64" stroke="#38bdf8" strokeWidth="2.5" strokeLinecap="round" />
            {/* Eye */}
            <circle cx="28" cy="40" r="5" fill="#ffffff" stroke="#b45309" strokeWidth="1" />
            <circle cx="27" cy="40" r="2.5" fill="#0f172a" />
            <circle cx="26" cy="38.5" r="1" fill="#ffffff" />
            <defs>
              <linearGradient id="angelGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#fef08a" />
                <stop offset="50%" stopColor="#f59e0b" />
                <stop offset="100%" stopColor="#d97706" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* 6. 🪼 Glowing Bioluminescent Jellyfish (Left & Right Depths) */}
        <div
          className="absolute left-[7%] bottom-[20%]"
          style={{
            animation: "jellyPuff 8s ease-in-out infinite",
          }}
        >
          <svg width="80" height="110" viewBox="0 0 80 110" className="drop-shadow-2xl" fill="none">
            {/* Outer Bell */}
            <path
              d="M10 45 C10 15, 70 15, 70 45 C70 52, 55 56, 40 56 C25 56, 10 52, 10 45 Z"
              fill="url(#jelly1)"
              opacity="0.85"
            />
            {/* Inner Bioluminescent Glow Arc */}
            <path
              d="M18 42 C18 20, 62 20, 62 42"
              stroke="rgba(255, 255, 255, 0.85)"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            {/* Glowing Flowing Tentacles */}
            <path d="M20 56 Q15 78 22 105" stroke="#f472b6" strokeWidth="2.5" strokeLinecap="round" opacity="0.8" />
            <path d="M30 56 Q36 80 28 110" stroke="#c084fc" strokeWidth="3" strokeLinecap="round" opacity="0.9" />
            <path d="M40 56 Q40 76 44 112" stroke="#67e8f9" strokeWidth="3.5" strokeLinecap="round" opacity="0.95" />
            <path d="M50 56 Q44 80 52 108" stroke="#c084fc" strokeWidth="3" strokeLinecap="round" opacity="0.9" />
            <path d="M60 56 Q65 78 58 104" stroke="#f472b6" strokeWidth="2.5" strokeLinecap="round" opacity="0.8" />
            <defs>
              <radialGradient id="jelly1" cx="50%" cy="30%" r="65%">
                <stop offset="0%" stopColor="#f472b6" />
                <stop offset="45%" stopColor="#c084fc" />
                <stop offset="100%" stopColor="#38bdf8" />
              </radialGradient>
            </defs>
          </svg>
        </div>

        {/* Second Small Jellyfish (Right Upper Depth) */}
        <div
          className="absolute right-[12%] top-[30%]"
          style={{
            animation: "jellyPuff 9.5s ease-in-out infinite 3.5s",
          }}
        >
          <svg width="60" height="85" viewBox="0 0 80 110" className="drop-shadow-xl" fill="none">
            <path
              d="M10 45 C10 15, 70 15, 70 45 C70 52, 55 56, 40 56 C25 56, 10 52, 10 45 Z"
              fill="url(#jelly2)"
              opacity="0.8"
            />
            <path d="M22 56 Q17 76 24 100" stroke="#22d3ee" strokeWidth="2" strokeLinecap="round" opacity="0.85" />
            <path d="M34 56 Q40 78 32 106" stroke="#818cf8" strokeWidth="2.5" strokeLinecap="round" opacity="0.9" />
            <path d="M46 56 Q40 78 48 104" stroke="#c084fc" strokeWidth="2.5" strokeLinecap="round" opacity="0.9" />
            <path d="M58 56 Q63 76 56 98" stroke="#22d3ee" strokeWidth="2" strokeLinecap="round" opacity="0.85" />
            <defs>
              <radialGradient id="jelly2" cx="50%" cy="30%" r="65%">
                <stop offset="0%" stopColor="#38bdf8" />
                <stop offset="50%" stopColor="#818cf8" />
                <stop offset="100%" stopColor="#c084fc" />
              </radialGradient>
            </defs>
          </svg>
        </div>

        {/* 7. 🐟 School of 4 Synchronized Neon Tetras (Fast Darting in Formation) */}
        <div
          className="absolute top-[54%]"
          style={{
            animation: "tetraSchool 20s linear infinite 4s",
          }}
        >
          <div className="relative w-48 h-24">
            {/* Tetra 1 (Leader) */}
            <div className="absolute left-0 top-6">
              <svg width="44" height="20" viewBox="0 0 44 20" fill="none">
                <path d="M34 10 L44 4 L44 16 Z" fill="#67e8f9" opacity="0.7" />
                <ellipse cx="18" cy="10" rx="16" ry="6" fill="#0f172a" />
                {/* Electric Cyan Neon Stripe */}
                <path d="M4 8 L32 8" stroke="#22d3ee" strokeWidth="2.2" strokeLinecap="round" />
                {/* Red Belly Stripe */}
                <path d="M14 12 L30 12" stroke="#f43f5e" strokeWidth="2" strokeLinecap="round" />
                <circle cx="8" cy="8" r="1.5" fill="#ffffff" />
              </svg>
            </div>
            {/* Tetra 2 (Upper Follower) */}
            <div className="absolute left-10 top-0">
              <svg width="40" height="18" viewBox="0 0 44 20" fill="none">
                <path d="M34 10 L44 4 L44 16 Z" fill="#67e8f9" opacity="0.7" />
                <ellipse cx="18" cy="10" rx="16" ry="6" fill="#0f172a" />
                <path d="M4 8 L32 8" stroke="#22d3ee" strokeWidth="2.2" strokeLinecap="round" />
                <path d="M14 12 L30 12" stroke="#f43f5e" strokeWidth="2" strokeLinecap="round" />
                <circle cx="8" cy="8" r="1.5" fill="#ffffff" />
              </svg>
            </div>
            {/* Tetra 3 (Lower Follower) */}
            <div className="absolute left-12 top-12">
              <svg width="38" height="18" viewBox="0 0 44 20" fill="none">
                <path d="M34 10 L44 4 L44 16 Z" fill="#67e8f9" opacity="0.7" />
                <ellipse cx="18" cy="10" rx="16" ry="6" fill="#0f172a" />
                <path d="M4 8 L32 8" stroke="#22d3ee" strokeWidth="2.2" strokeLinecap="round" />
                <path d="M14 12 L30 12" stroke="#f43f5e" strokeWidth="2" strokeLinecap="round" />
                <circle cx="8" cy="8" r="1.5" fill="#ffffff" />
              </svg>
            </div>
            {/* Tetra 4 (Rear Guard) */}
            <div className="absolute left-24 top-6">
              <svg width="36" height="16" viewBox="0 0 44 20" fill="none">
                <path d="M34 10 L44 4 L44 16 Z" fill="#67e8f9" opacity="0.7" />
                <ellipse cx="18" cy="10" rx="16" ry="6" fill="#0f172a" />
                <path d="M4 8 L32 8" stroke="#22d3ee" strokeWidth="2.2" strokeLinecap="round" />
                <path d="M14 12 L30 12" stroke="#f43f5e" strokeWidth="2" strokeLinecap="round" />
                <circle cx="8" cy="8" r="1.5" fill="#ffffff" />
              </svg>
            </div>
          </div>
        </div>

        {/* 8. 🌊 Graceful Seahorse (Bobbing upright near the seabed kelp) */}
        <div
          className="absolute right-[22%] bottom-[16%]"
          style={{
            animation: "seahorseBob 6s ease-in-out infinite",
          }}
        >
          <svg width="60" height="95" viewBox="0 0 60 95" className="drop-shadow-lg" fill="none">
            {/* Tiny Back Fin Flutter */}
            <path
              d="M38 42 C48 40, 48 52, 38 50 Z"
              fill="#fbbf24"
              opacity="0.85"
              style={{
                transformOrigin: "38px 46px",
                animation: "seahorseFin 0.2s ease-in-out infinite",
              }}
            />
            {/* Snout & Crown Head */}
            <path
              d="M12 18 L24 20 C25 15, 28 10, 32 8 C35 12, 34 18, 30 22 C34 26, 36 34, 32 42 C28 50, 26 62, 30 72 C34 82, 28 92, 18 90 C12 88, 14 80, 20 80 C24 80, 24 74, 20 66 C15 56, 16 42, 22 32 C20 28, 18 24, 12 18 Z"
              fill="url(#seahorseGrad)"
              stroke="#d97706"
              strokeWidth="1.5"
            />
            {/* Pouch / Belly Ridge */}
            <path
              d="M22 36 C28 40, 28 54, 22 60"
              stroke="#fef08a"
              strokeWidth="2"
              strokeLinecap="round"
            />
            {/* Eye */}
            <circle cx="26" cy="18" r="3" fill="#ffffff" />
            <circle cx="25.5" cy="18" r="1.5" fill="#0f172a" />
            <defs>
              <linearGradient id="seahorseGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#f59e0b" />
                <stop offset="50%" stopColor="#d97706" />
                <stop offset="100%" stopColor="#b45309" />
              </linearGradient>
            </defs>
          </svg>
        </div>

      </div>

      {/* 🪸 LIVE ANIMATED SEABED (Reef Floor, Seaweed, & Scuttling Crab) 🪸 */}
      {showSeabed && (
        <div
          className={`absolute bottom-0 left-0 right-0 h-48 pointer-events-none transition-opacity duration-700 ${
            subtle ? "opacity-40" : "opacity-90"
          }`}
        >
          {/* Seabed Depth Gradient Base */}
          <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[#010810] via-[#021324]/90 to-transparent" />

          {/* 🦀 Cute Animated Seabed Crab */}
          <div
            className="absolute left-[38%] bottom-3 z-10"
            style={{
              animation: "crabScuttle 12s ease-in-out infinite",
            }}
          >
            <svg width="56" height="36" viewBox="0 0 56 36" fill="none">
              {/* Legs */}
              <path d="M12 24 Q6 28 4 34 M16 26 Q12 32 10 36 M44 24 Q50 28 52 34 M40 26 Q44 32 46 36" stroke="#ea580c" strokeWidth="2" strokeLinecap="round" />
              {/* Claws */}
              <path
                d="M16 16 Q8 10 10 4 Q14 2 18 10 Z"
                fill="#f97316"
                stroke="#c2410c"
                strokeWidth="1.2"
                style={{ transformOrigin: "16px 16px", animation: "crabClaw 2s ease-in-out infinite" }}
              />
              <path
                d="M40 16 Q48 10 46 4 Q42 2 38 10 Z"
                fill="#f97316"
                stroke="#c2410c"
                strokeWidth="1.2"
                style={{ transformOrigin: "40px 16px", animation: "crabClaw 2s ease-in-out infinite 0.5s" }}
              />
              {/* Main Shell */}
              <ellipse cx="28" cy="22" rx="14" ry="9" fill="#f97316" stroke="#c2410c" strokeWidth="1.5" />
              {/* Eyestalks */}
              <circle cx="23" cy="12" r="3" fill="#ffffff" stroke="#c2410c" strokeWidth="1" />
              <circle cx="23" cy="12" r="1.5" fill="#0f172a" />
              <circle cx="33" cy="12" r="3" fill="#ffffff" stroke="#c2410c" strokeWidth="1" />
              <circle cx="33" cy="12" r="1.5" fill="#0f172a" />
            </svg>
          </div>

          {/* 🌿 Dense Lush Seaweed / Kelp Forest Left */}
          <div className="absolute left-[3%] bottom-0 flex items-end gap-1.5 opacity-80">
            {/* Kelp 1 */}
            <svg
              width="36"
              height="160"
              viewBox="0 0 36 160"
              fill="none"
              style={{
                transformOrigin: "bottom center",
                animation: "kelpSwayLeft 5s ease-in-out infinite",
              }}
            >
              <path
                d="M18 160 Q6 120 24 85 Q6 50 20 15 Q24 0 20 0"
                stroke="#059669"
                strokeWidth="8"
                strokeLinecap="round"
              />
              <path
                d="M18 160 Q30 115 14 80 Q32 45 16 10"
                stroke="#10b981"
                strokeWidth="4"
                strokeLinecap="round"
              />
            </svg>
            {/* Kelp 2 */}
            <svg
              width="42"
              height="190"
              viewBox="0 0 42 190"
              fill="none"
              style={{
                transformOrigin: "bottom center",
                animation: "kelpSwayRight 6.5s ease-in-out infinite 0.8s",
              }}
            >
              <path
                d="M20 190 Q36 140 10 95 Q38 50 18 10"
                stroke="#047857"
                strokeWidth="9"
                strokeLinecap="round"
              />
              <path
                d="M20 190 Q8 140 28 95 Q8 50 24 10"
                stroke="#34d399"
                strokeWidth="4.5"
                strokeLinecap="round"
              />
            </svg>
          </div>

          {/* 🪸 Coral Reef Center Left */}
          <div className="absolute left-[20%] bottom-0 opacity-70">
            <svg width="90" height="75" viewBox="0 0 90 75" fill="none">
              <path
                d="M15 75 C10 50, 5 35, 18 25 C25 18, 32 28, 30 40 C35 30, 48 20, 56 32 C60 38, 55 52, 58 75 Z"
                fill="#f43f5e"
                opacity="0.85"
              />
              <path
                d="M45 75 C48 55, 58 40, 68 45 C78 50, 72 65, 75 75 Z"
                fill="#fb7185"
                opacity="0.9"
              />
            </svg>
          </div>

          {/* 🌿 Dense Lush Seaweed / Kelp Forest Right */}
          <div className="absolute right-[5%] bottom-0 flex items-end gap-2 opacity-85">
            <svg
              width="40"
              height="180"
              viewBox="0 0 40 180"
              fill="none"
              style={{
                transformOrigin: "bottom center",
                animation: "kelpSwayRight 5.8s ease-in-out infinite 0.4s",
              }}
            >
              <path
                d="M20 180 Q6 130 30 85 Q8 40 22 5"
                stroke="#059669"
                strokeWidth="8"
                strokeLinecap="round"
              />
            </svg>
            <svg
              width="36"
              height="150"
              viewBox="0 0 36 150"
              fill="none"
              style={{
                transformOrigin: "bottom center",
                animation: "kelpSwayLeft 7s ease-in-out infinite 1.2s",
              }}
            >
              <path
                d="M18 150 Q30 110 10 70 Q28 35 15 0"
                stroke="#10b981"
                strokeWidth="7"
                strokeLinecap="round"
              />
            </svg>
          </div>
        </div>
      )}
    </div>
  );
}
