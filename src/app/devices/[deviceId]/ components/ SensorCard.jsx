"use client";

import { labelize } from "../../utils/format";

export default function SensorCard({ sensorKey, value, onClick }) {
  return (
    <button
      onClick={onClick}
      className="text-left rounded-2xl bg-black/20 ring-1 ring-white/10 p-4 hover:bg-black/30 transition"
    >
      <div className="text-xs opacity-70">{labelize(sensorKey)}</div>
      <div className="mt-1 text-2xl font-semibold">{value ?? "—"}</div>
      <div className="mt-2 text-xs opacity-60">Tap to view graph</div>
    </button>
  );
}
