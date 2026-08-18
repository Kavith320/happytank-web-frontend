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

  // Generate bubbles on client mount only
  const bubbleCount = density === "dense" ? 22 : density === "sparse" ? 8 : 14;
  const bubbles = useMemo(() => {
    if (!mounted) return [];
    return Array.from({ length: bubbleCount }).map((_, i) => ({
      id: i,
      size: Math.floor(Math.random() * 18) + 8,
      left: `${(i * (100 / bubbleCount) + Math.random() * 4).toFixed(1)}%`,
      duration: `${(Math.random() * 6 + 8).toFixed(1)}s`,
      delay: `${(Math.random() * 5).toFixed(1)}s`,
    }));
  }, [bubbleCount, mounted]);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {/* 🌊 Deep Ocean Gradient Base */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#020b14] via-[#04192d] to-[#010912]" />

      {/* ☀️ Caustic Shimmering Sunbeams */}
      <div
        className={`absolute -top-32 left-1/2 -translate-x-1/2 w-[140vw] h-[70vh] transition-opacity duration-700 ${subtle ? "opacity-10" : "opacity-25"
          }`}
        style={{
          background:
            "radial-gradient(ellipse at center top, rgba(34, 211, 238, 0.35) 0%, rgba(6, 182, 212, 0.1) 45%, transparent 75%)",
          animation: "causticShimmer 10s ease-in-out infinite",
        }}
      />
      <div
        className={`absolute -top-20 left-1/4 w-[90vw] h-[50vh] transition-opacity duration-700 ${subtle ? "opacity-10" : "opacity-20"
          }`}
        style={{
          background:
            "radial-gradient(ellipse at center top, rgba(20, 184, 166, 0.3) 0%, transparent 65%)",
          animation: "causticShimmer 14s ease-in-out infinite 3s",
        }}
      />

      {/* 🫧 Rising Bubbles */}
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

      {/* 🐠 DIVERSE MARINE LIFE SWIMMING 🐠 */}
      <div className={`transition-opacity duration-700 ${subtle ? "opacity-40" : "opacity-90"}`}>
        {/* 1. Orange Clownfish (Upper-Mid Level, Swimming Right to Left) */}
        <div
          className="absolute top-[18%]"
          style={{
            animation: "swimLeft 24s linear infinite 0s",
          }}
        >
          <svg width="68" height="42" viewBox="0 0 68 42" className="drop-shadow-lg" fill="none">
            <path
              d="M52 21 C62 10, 66 8, 67 12 C65 21, 65 21, 67 30 C66 34, 62 32, 52 21 Z"
              fill="#ea580c"
              stroke="#1c1917"
              strokeWidth="1.5"
              style={{
                transformOrigin: "52px 21px",
                animation: "tailWiggle 0.4s ease-in-out infinite",
              }}
            />
            <path
              d="M10 21 C12 10, 32 4, 52 14 C55 21, 55 21, 52 28 C32 38, 12 32, 10 21 Z"
              fill="#f97316"
              stroke="#1c1917"
              strokeWidth="1.5"
            />
            <path
              d="M22 8 C25 14, 25 28, 22 34 C19 32, 19 10, 22 8 Z"
              fill="#ffffff"
              stroke="#1c1917"
              strokeWidth="1"
            />
            <path
              d="M36 7 C39 14, 39 28, 36 35 C33 34, 33 8, 36 7 Z"
              fill="#ffffff"
              stroke="#1c1917"
              strokeWidth="1"
            />
            <path
              d="M48 13 C50 17, 50 25, 48 29 C46 28, 46 14, 48 13 Z"
              fill="#ffffff"
              stroke="#1c1917"
              strokeWidth="1"
            />
            <circle cx="16" cy="18" r="3.5" fill="#ffffff" />
            <circle cx="15.5" cy="18" r="1.8" fill="#0f172a" />
            <ellipse
              cx="26"
              cy="24"
              rx="5"
              ry="3"
              fill="#ea580c"
              stroke="#1c1917"
              strokeWidth="1"
            />
          </svg>
        </div>

        {/* 2. Royal Blue Tang / Dory (Mid-Level, Swimming Left to Right) */}
        <div
          className="absolute top-[40%]"
          style={{
            animation: "swimRight 30s linear infinite 5s",
          }}
        >
          <svg width="76" height="46" viewBox="0 0 76 46" className="drop-shadow-lg" fill="none">
            <path
              d="M58 23 C68 11, 74 9, 75 14 C73 23, 73 23, 75 32 C74 37, 68 35, 58 23 Z"
              fill="#facc15"
              stroke="#1e293b"
              strokeWidth="1.5"
              style={{
                transformOrigin: "58px 23px",
                animation: "tailWiggle 0.5s ease-in-out infinite",
              }}
            />
            <path
              d="M10 23 C14 8, 38 3, 58 15 C62 23, 62 23, 58 31 C38 43, 14 38, 10 23 Z"
              fill="#2563eb"
              stroke="#1e293b"
              strokeWidth="1.5"
            />
            <path
              d="M26 10 C38 12, 50 18, 54 26 C46 28, 34 22, 28 25 C25 27, 20 22, 26 10 Z"
              fill="#0f172a"
            />
            <path d="M50 20 L58 16 L58 30 L50 26 Z" fill="#facc15" />
            <circle cx="18" cy="19" r="4" fill="#ffffff" />
            <circle cx="17.5" cy="19" r="2" fill="#0f172a" />
            <ellipse
              cx="30"
              cy="27"
              rx="6"
              ry="3.5"
              fill="#3b82f6"
              stroke="#1e293b"
              strokeWidth="1"
            />
          </svg>
        </div>

        {/* 3. Bright Yellow Tang (Lower-Mid Level) */}
        <div
          className="absolute top-[62%]"
          style={{
            animation: "swimLeft 36s linear infinite 12s",
          }}
        >
          <svg width="60" height="50" viewBox="0 0 60 50" className="drop-shadow-lg" fill="none">
            <path
              d="M46 25 C54 16, 58 14, 59 18 C58 25, 58 25, 59 32 C58 36, 54 34, 46 25 Z"
              fill="#eab308"
              stroke="#854d0e"
              strokeWidth="1.2"
              style={{
                transformOrigin: "46px 25px",
                animation: "tailWiggle 0.35s ease-in-out infinite",
              }}
            />
            <path
              d="M8 25 C12 9, 32 4, 46 16 C50 25, 50 25, 46 34 C32 46, 12 41, 8 25 Z"
              fill="#facc15"
              stroke="#ca8a04"
              strokeWidth="1.5"
            />
            <path d="M22 7 C30 5, 40 8, 44 14 Z" fill="#eab308" />
            <path d="M22 43 C30 45, 40 42, 44 36 Z" fill="#eab308" />
            <circle cx="16" cy="22" r="3.5" fill="#ffffff" />
            <circle cx="15.5" cy="22" r="1.7" fill="#0f172a" />
          </svg>
        </div>

        {/* 4. Bioluminescent Floating Jellyfish */}
        <div
          className="absolute left-[8%] bottom-[24%]"
          style={{
            animation: "jellyFloat 7s ease-in-out infinite",
          }}
        >
          <svg width="50" height="68" viewBox="0 0 54 74" className="drop-shadow-xl" fill="none">
            <path
              d="M6 30 C6 10, 48 10, 48 30 C48 34, 38 36, 27 36 C16 36, 6 34, 6 30 Z"
              fill="url(#jellyGrad)"
              opacity="0.8"
            />
            <path
              d="M12 28 C12 14, 42 14, 42 28"
              stroke="rgba(255, 255, 255, 0.7)"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
            <path
              d="M14 36 Q11 50 16 68"
              stroke="#f472b6"
              strokeWidth="1.5"
              strokeLinecap="round"
              opacity="0.75"
            />
            <path
              d="M21 36 Q25 52 20 72"
              stroke="#c084fc"
              strokeWidth="1.8"
              strokeLinecap="round"
              opacity="0.85"
            />
            <path
              d="M27 36 Q27 50 30 74"
              stroke="#67e8f9"
              strokeWidth="2"
              strokeLinecap="round"
              opacity="0.9"
            />
            <path
              d="M33 36 Q30 52 35 70"
              stroke="#c084fc"
              strokeWidth="1.8"
              strokeLinecap="round"
              opacity="0.85"
            />
            <path
              d="M40 36 Q43 50 38 66"
              stroke="#f472b6"
              strokeWidth="1.5"
              strokeLinecap="round"
              opacity="0.75"
            />
            <defs>
              <radialGradient id="jellyGrad" cx="50%" cy="30%" r="60%">
                <stop offset="0%" stopColor="#f472b6" />
                <stop offset="50%" stopColor="#c084fc" />
                <stop offset="100%" stopColor="#38bdf8" />
              </radialGradient>
            </defs>
          </svg>
        </div>

        {/* 5. Gentle Sea Turtle */}
        <div
          className="absolute top-[70%] opacity-25"
          style={{
            animation: "swimRight 48s linear infinite 16s",
          }}
        >
          <svg width="65" height="46" viewBox="0 0 70 50" fill="none">
            <ellipse
              cx="35"
              cy="25"
              rx="18"
              ry="13"
              fill="#047857"
              stroke="#065f46"
              strokeWidth="1.5"
            />
            <circle cx="35" cy="25" r="7" fill="#059669" />
            <path d="M26 14 C20 4, 12 6, 18 18 Z" fill="#10b981" />
            <path d="M44 14 C50 4, 58 6, 52 18 Z" fill="#10b981" />
            <path d="M27 36 C22 44, 18 42, 22 34 Z" fill="#059669" />
            <path d="M43 36 C48 44, 52 42, 48 34 Z" fill="#059669" />
            <ellipse cx="6" cy="25" rx="5" ry="4" fill="#10b981" />
          </svg>
        </div>
      </div>

      {/* 🪸 LIVE ANIMATED SEABED (Bottom Floor) 🪸 */}
      {showSeabed && (
        <div
          className={`absolute bottom-0 left-0 right-0 h-44 pointer-events-none transition-opacity duration-700 ${subtle ? "opacity-35" : "opacity-85"
            }`}
        >
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#010810] via-[#021324]/90 to-transparent" />

          <svg
            className="absolute bottom-0 left-0 w-full h-44"
            preserveAspectRatio="none"
            viewBox="0 0 1440 180"
            fill="none"
          >
            <path
              d="M0 180 L0 150 Q120 120 240 160 Q380 130 520 170 Q680 140 840 165 Q1020 125 1200 160 Q1340 135 1440 155 L1440 180 Z"
              fill="#021222"
            />
            <path
              d="M0 180 L0 165 Q180 145 360 170 Q540 150 720 175 Q900 155 1080 170 Q1260 148 1440 170 L1440 180 Z"
              fill="#010a14"
            />

            <g
              style={{
                transformOrigin: "120px 180px",
                animation: "kelpSwayLeft 5s ease-in-out infinite",
              }}
            >
              <path
                d="M120 180 Q100 110 125 60 Q105 20 115 0 Q130 25 110 65 Q135 115 120 180 Z"
                fill="#059669"
                opacity="0.6"
              />
              <path
                d="M140 180 Q160 120 135 75 Q155 35 145 10 Q130 38 150 80 Q125 125 140 180 Z"
                fill="#10b981"
                opacity="0.7"
              />
            </g>
            <g
              style={{
                transformOrigin: "280px 180px",
                animation: "kelpSwayRight 6s ease-in-out infinite 1s",
              }}
            >
              <path
                d="M280 180 Q260 125 285 70 Q270 30 278 15 Q290 35 270 75 Q295 130 280 180 Z"
                fill="#0d9488"
                opacity="0.65"
              />
            </g>

            <g
              style={{
                transformOrigin: "720px 180px",
                animation: "kelpSwayLeft 7s ease-in-out infinite 0.5s",
              }}
            >
              <path
                d="M720 180 Q700 130 725 80 Q710 40 720 20 Q735 45 715 85 Q740 135 720 180 Z"
                fill="#065f46"
                opacity="0.5"
              />
              <path
                d="M745 180 Q770 125 750 80 Q768 40 760 15 Q745 42 762 85 Q738 130 745 180 Z"
                fill="#047857"
                opacity="0.6"
              />
            </g>

            <g
              style={{
                transformOrigin: "1150px 180px",
                animation: "kelpSwayRight 5.5s ease-in-out infinite 1.5s",
              }}
            >
              <path
                d="M1150 180 Q1130 115 1155 65 Q1140 25 1148 5 Q1162 28 1142 70 Q1168 120 1150 180 Z"
                fill="#059669"
                opacity="0.6"
              />
              <path
                d="M1175 180 Q1200 125 1180 80 Q1200 40 1190 18 Q1175 42 1192 85 Q1168 130 1175 180 Z"
                fill="#14b8a6"
                opacity="0.7"
              />
            </g>
            <g
              style={{
                transformOrigin: "1320px 180px",
                animation: "kelpSwayLeft 6.5s ease-in-out infinite 2s",
              }}
            >
              <path
                d="M1320 180 Q1300 130 1325 75 Q1310 35 1318 15 Q1332 38 1312 80 Q1338 135 1320 180 Z"
                fill="#047857"
                opacity="0.65"
              />
            </g>

            <circle cx="190" cy="162" r="14" fill="#f43f5e" opacity="0.7" />
            <circle cx="205" cy="168" r="10" fill="#fb7185" opacity="0.65" />
            <circle cx="680" cy="165" r="12" fill="#f59e0b" opacity="0.6" />
            <circle cx="695" cy="160" r="15" fill="#fbbf24" opacity="0.7" />
            <circle cx="1230" cy="164" r="16" fill="#8b5cf6" opacity="0.65" />
            <circle cx="1248" cy="168" r="11" fill="#a78bfa" opacity="0.7" />
          </svg>
        </div>
      )}

      {/* 🌑 Dark Ambient Backdrop Vignette (for control contrast) */}
      {subtle && (
        <div className="absolute inset-0 bg-[#020b14]/50 pointer-events-none backdrop-blur-[2px]" />
      )}
    </div>
  );
}
