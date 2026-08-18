"use client";

import React, { useEffect, useState } from "react";
import { Fish, Waves, Sparkles } from "lucide-react";

export default function AquariumLoader({
  title = "Connecting to Aquarium",
  subtitle = "Synchronizing live telemetry and sensor probes...",
  fullScreen = false,
}) {
  const messages = [
    "Reading temperature & pH probes...",
    "Calibrating water flow telemetry...",
    "Synchronizing actuator statuses...",
    "Establishing secure IoT telemetry stream...",
  ];

  const [msgIndex, setMsgIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setMsgIndex((prev) => (prev + 1) % messages.length);
    }, 1800);
    return () => clearInterval(timer);
  }, [messages.length]);

  const content = (
    <div className="flex flex-col items-center justify-center p-8 max-w-sm mx-auto text-center relative z-10">
      {/* 🌊 Living Sonar Pulse Ring */}
      <div className="relative mb-6">
        {/* Outer Glow Ring */}
        <div className="absolute -inset-4 rounded-full bg-cyan-500/20 blur-xl animate-pulse" />
        
        {/* Sonar Ripple Waves */}
        <div className="absolute inset-0 rounded-full border-2 border-cyan-400/40 animate-ping" />
        <div 
          className="absolute inset-0 rounded-full border border-teal-400/30"
          style={{ animation: "ping 2s cubic-bezier(0, 0, 0.2, 1) infinite 0.6s" }}
        />

        {/* Center Aquatic Orb */}
        <div className="relative w-20 h-20 rounded-full bg-gradient-to-tr from-cyan-600 via-teal-500 to-blue-600 flex items-center justify-center shadow-xl shadow-cyan-500/40 border border-white/30">
          <Fish className="w-10 h-10 text-white drop-shadow-md animate-bounce" style={{ animationDuration: "2s" }} />
        </div>

        {/* Small Floating Bubbles around Icon */}
        <span className="absolute -top-1 right-1 w-3.5 h-3.5 rounded-full bg-cyan-200/80 animate-ping" style={{ animationDuration: "1.5s" }} />
        <span className="absolute bottom-2 -left-1 w-2.5 h-2.5 rounded-full bg-teal-200/80 animate-ping" style={{ animationDuration: "2.2s" }} />
      </div>

      {/* Title */}
      <h3 className="text-xl font-extrabold text-white tracking-tight mb-1.5 flex items-center gap-2">
        <span>{title}</span>
        <Sparkles className="w-4 h-4 text-cyan-400 animate-spin" style={{ animationDuration: "4s" }} />
      </h3>

      {/* Rotating Subtitle */}
      <p className="text-xs text-cyan-200/75 h-5 font-medium transition-all duration-300">
        {messages[msgIndex] || subtitle}
      </p>

      {/* Progress Wave Indicator */}
      <div className="w-48 h-1.5 bg-white/10 rounded-full overflow-hidden mt-5 border border-white/10">
        <div 
          className="h-full bg-gradient-to-r from-cyan-400 via-teal-300 to-blue-500 rounded-full animate-pulse"
          style={{
            width: "100%",
            backgroundSize: "200% 100%",
            animation: "progressWave 1.5s ease-in-out infinite",
          }}
        />
      </div>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        {content}
      </div>
    );
  }

  return (
    <div className="glass-panel p-6 sm:p-10 bg-[#05172a]/90 border-white/15 backdrop-blur-2xl shadow-2xl rounded-3xl">
      {content}
    </div>
  );
}
