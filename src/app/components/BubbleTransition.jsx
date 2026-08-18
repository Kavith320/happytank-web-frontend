"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { usePathname } from "next/navigation";

export default function BubbleTransition() {
  const pathname = usePathname();
  const [active, setActive] = useState(false);
  const [bubbles, setBubbles] = useState([]);
  const audioCtxRef = useRef(null);

  // Play subtle bubble pop sound
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

      const count = 3;
      for (let i = 0; i < count; i++) {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        const startTime = ctx.currentTime + i * 0.08 + Math.random() * 0.03;
        const startFreq = 220 + Math.random() * 140;
        const endFreq = startFreq + 320 + Math.random() * 180;

        osc.type = "sine";
        osc.frequency.setValueAtTime(startFreq, startTime);
        osc.frequency.exponentialRampToValueAtTime(endFreq, startTime + 0.07);

        gain.gain.setValueAtTime(0.05, startTime);
        gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.07);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(startTime);
        osc.stop(startTime + 0.08);
      }
    } catch {
      // Ignored if sound is restricted by browser policy
    }
  }, []);

  const triggerBubbles = useCallback(() => {
    const animTypes = ["bubbleRushUp", "bubbleRushUpLeft", "bubbleRushUpRight"];

    const newBubbles = Array.from({ length: 48 }).map((_, i) => {
      const size = Math.floor(Math.random() * 38) + 10; // 10px to 48px
      const isLarge = size > 28;
      const left = Math.floor(Math.random() * 96) + 2; // 2% to 98%
      const duration = (Math.random() * 0.35 + 0.55).toFixed(2); // 0.55s - 0.9s
      const delay = (Math.random() * 0.2).toFixed(2); // 0s - 0.2s
      const anim = animTypes[i % animTypes.length];

      return {
        id: `${i}-${Date.now()}`,
        size,
        isLarge,
        left: `${left}%`,
        duration: `${duration}s`,
        delay: `${delay}s`,
        anim,
      };
    });

    setBubbles(newBubbles);
    setActive(true);
    playBubbleSound();

    const timer = setTimeout(() => {
      setActive(false);
    }, 850);

    return () => clearTimeout(timer);
  }, [playBubbleSound]);

  // Trigger stream on route change AND initial page mount
  useEffect(() => {
    const cleanup = triggerBubbles();
    return () => cleanup && cleanup();
  }, [pathname, triggerBubbles]);

  if (!active) return null;

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden select-none"
    >
      {/* 🌊 Oceanic Flash Wash Curtain */}
      <div
        className="absolute inset-0 bg-gradient-to-t from-[#02182b]/80 via-[#032b49]/35 to-transparent backdrop-blur-[1px]"
        style={{
          animation: "bubbleVeilFade 0.85s cubic-bezier(0.16, 1, 0.3, 1) forwards",
        }}
      />

      {/* 🫧 Dense Rising Bubble Stream */}
      {bubbles.map((b) => (
        <div
          key={b.id}
          className="absolute rounded-full pointer-events-none will-change-transform"
          style={{
            left: b.left,
            bottom: "-60px",
            width: `${b.size}px`,
            height: `${b.size}px`,
            background: b.isLarge
              ? "radial-gradient(circle at 35% 35%, rgba(255, 255, 255, 0.95), rgba(34, 211, 238, 0.5) 50%, rgba(6, 182, 212, 0.2) 80%, rgba(255, 255, 255, 0.5) 100%)"
              : "radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.9), rgba(103, 232, 249, 0.55) 60%, rgba(255, 255, 255, 0.3) 100%)",
            boxShadow: b.isLarge
              ? "inset -2px -2px 6px rgba(2, 132, 199, 0.6), 0 0 16px rgba(34, 211, 238, 0.7)"
              : "inset -1px -1px 3px rgba(2, 132, 199, 0.4), 0 0 10px rgba(34, 211, 238, 0.5)",
            animation: `${b.anim} ${b.duration} cubic-bezier(0.25, 0.46, 0.45, 0.94) ${b.delay} forwards`,
          }}
        >
          {/* Specular Highlight Glint */}
          <div className="absolute top-1 left-1.5 w-1.5 h-1.5 bg-white rounded-full opacity-90 blur-[0.3px]" />
        </div>
      ))}
    </div>
  );
}
