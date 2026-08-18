"use client";

import React, { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

export default function AquariumLoader({
  title = "Loading Aquarium...",
  subtitle = "Synchronizing live telemetry...",
  fullScreen = false,
}) {
  const [dots, setDots] = useState("");

  useEffect(() => {
    const timer = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? "" : prev + "."));
    }, 450);
    return () => clearInterval(timer);
  }, []);

  const content = (
    <div className="flex flex-col items-center justify-center p-6 text-center">
      {/* Sleek Dual Glowing Ring Spinner */}
      <div className="relative w-12 h-12 mb-4 flex items-center justify-center">
        {/* Soft Glow Ambient */}
        <div className="absolute inset-0 rounded-full bg-cyan-500/20 blur-lg animate-pulse" />
        
        {/* Outer Ring */}
        <div className="absolute inset-0 rounded-full border-2 border-cyan-500/20 border-t-cyan-400 animate-spin" />
        
        {/* Inner Counter-Spinning Ring */}
        <div 
          className="w-7 h-7 rounded-full border-2 border-teal-500/20 border-b-teal-300 animate-spin" 
          style={{ animationDirection: "reverse", animationDuration: "1.2s" }}
        />
      </div>

      {/* Title */}
      <p className="text-sm font-semibold text-white tracking-wide">
        {title}
        <span className="inline-block w-4 text-left text-cyan-400">{dots}</span>
      </p>

      {/* Subtitle */}
      {subtitle && (
        <p className="text-xs text-cyan-200/60 mt-1 max-w-xs">
          {subtitle}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        {content}
      </div>
    );
  }

  return (
    <div className="py-6 flex items-center justify-center">
      {content}
    </div>
  );
}
