"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { usePathname } from "next/navigation";

export default function BubbleTransition() {
  const pathname = usePathname();
  const [active, setActive] = useState(false);
  const [bubbles, setBubbles] = useState([]);
  const isFirstRender = useRef(true);
  const audioCtxRef = useRef(null);

  // Play playful synthesized bubble pop sounds via Web Audio API
  const playBubbleSound = useCallback(() => {
    try {
      if (typeof window === "undefined") return;
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      
      if (!audioCtxRef.current) {
        audioCtxRef.current = new AudioContext();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === "suspended") {
        ctx.resume();
      }

      // Play 2-3 micro bubble pops
      const count = 3;
      for (let i = 0; i < count; i++) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        const startTime = ctx.currentTime + i * 0.08 + Math.random() * 0.04;
        const startFreq = 200 + Math.random() * 150;
        const endFreq = startFreq + 350 + Math.random() * 200;

        osc.type = "sine";
        osc.frequency.setValueAtTime(startFreq, startTime);
        osc.frequency.exponentialRampToValueAtTime(endFreq, startTime + 0.07);

        gain.gain.setValueAtTime(0.06, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.07);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + 0.08);
      }
    } catch {
      // Audio playback fails gracefully if blocked
    }
  }, []);

  // Trigger bubble stream sequence whenever pathname changes
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    // Generate 48 air bubbles with varied sizes, trajectories, and delays
    const newBubbles = Array.from({ length: 48 }).map((_, i) => {
      const size = Math.floor(Math.random() * 38) + 8; // 8px to 46px
      const isLarge = size > 28;
      const left = Math.floor(Math.random() * 96) + 2; // 2% to 98%
      const duration = (Math.random() * 0.4 + 0.5).toFixed(2); // 0.5s - 0.9s
      const delay = (Math.random() * 0.22).toFixed(2); // 0s - 0.22s
      const wobble = Math.floor(Math.random() * 60) - 30; // -30px to +30px

      return {
        id: `${i}-${Date.now()}`,
        size,
        isLarge,
        left: `${left}%`,
        duration: `${duration}s`,
        delay: `${delay}s`,
        wobble: `${wobble}px`,
      };
    });

    setBubbles(newBubbles);
    setActive(true);
    playBubbleSound();

    const timer = setTimeout(() => {
      setActive(false);
    }, 850);

    return () => clearTimeout(timer);
  }, [pathname, playBubbleSound]);

  if (!active) return null;

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden transition-opacity duration-300"
    >
      {/* 🌊 Oceanic Flash Wash Curtain */}
      <div 
        className="absolute inset-0 bg-gradient-to-t from-cyan-950/75 via-teal-900/30 to-transparent backdrop-blur-[1.5px]"
        style={{
          animation: "bubbleVeilFade 0.85s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        }}
      />

      {/* 🫧 Dense Rising Bubble Stream */}
      {bubbles.map((b) => (
        <div
          key={b.id}
          className="absolute rounded-full pointer-events-none"
          style={{
            left: b.left,
            bottom: "-60px",
            width: `${b.size}px`,
            height: `${b.size}px`,
            background: b.isLarge
              ? "radial-gradient(circle at 35% 35%, rgba(255, 255, 255, 0.95), rgba(34, 211, 238, 0.45) 50%, rgba(6, 182, 212, 0.15) 80%, rgba(255, 255, 255, 0.4) 100%)"
              : "radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.9), rgba(103, 232, 249, 0.5) 60%, rgba(255, 255, 255, 0.2) 100%)",
            boxShadow: b.isLarge
              ? "inset -2px -2px 6px rgba(2, 132, 199, 0.5), 0 0 14px rgba(34, 211, 238, 0.6)"
              : "inset -1px -1px 3px rgba(2, 132, 199, 0.4), 0 0 8px rgba(34, 211, 238, 0.4)",
            animation: `bubbleRushUp ${b.duration} cubic-bezier(0.25, 0.46, 0.45, 0.94) ${b.delay} forwards`,
            "--wobble-offset": b.wobble,
          }}
        >
          {/* Specular Glint */}
          <div className="absolute top-1 left-1.5 w-1.5 h-1.5 bg-white rounded-full opacity-90 blur-[0.3px]" />
        </div>
      ))}
    </div>
  );
}
