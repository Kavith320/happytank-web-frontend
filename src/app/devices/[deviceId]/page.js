"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { apiGet, apiPost } from "../../lib/api";
import { removeToken } from "../../lib/auth";
import AquariumBackground from "../../components/AquariumBackground";
import AquariumLoader from "../../components/AquariumLoader";

import {
  Thermometer,
  Sun,
  Waves,
  Wind,
  Gauge,
  Activity,
  Droplet,
  Flame,
  Lightbulb,
  Fan,
  Power,
  RefreshCw,
  ArrowLeft,
  Calendar,
  Sparkles,
  X,
  Clock,
  Sliders,
  Bot,
  Zap,
  Lock,
  Utensils,
  Fish,
} from "lucide-react";

/* -------------------- Helper Functions -------------------- */
function timeMsFromObjectId(oid) {
  if (!oid) return null;
  const s = String(oid);
  if (s.length !== 24) return null;
  const seconds = parseInt(s.slice(0, 8), 16);
  if (Number.isNaN(seconds)) return null;
  return seconds * 1000;
}

function fmtTime(msOrAny) {
  if (!msOrAny) return "—";
  const d = typeof msOrAny === "number" ? new Date(msOrAny) : new Date(msOrAny);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

function getEntryTimeMs(entry) {
  if (!entry || typeof entry !== "object") return null;

  const candidates = [
    entry.ts,
    entry.time,
    entry.timestamp,
    entry.createdAt,
    entry.updatedAt,
    entry.receivedAt,
    entry._ts,
  ];

  for (const c of candidates) {
    if (c == null) continue;

    if (typeof c === "number") return c < 1e12 ? c * 1000 : c;

    if (typeof c === "string") {
      const n = Number(c);
      if (!Number.isNaN(n) && c.trim() !== "") return n < 1e12 ? n * 1000 : n;

      const t = new Date(c).getTime();
      if (!Number.isNaN(t)) return t;
    }
  }

  return timeMsFromObjectId(entry._id);
}

function isOnlineByLatest(latestEntry, minutes = 2) {
  const ms = getEntryTimeMs(latestEntry);
  if (!ms) return false;
  return Date.now() - ms < minutes * 60 * 1000;
}

function normalizeDevice(raw) {
  return raw?.device ?? raw ?? null;
}

function normalizeActuators(device) {
  const fromControl = device?.control?.actuators;
  const fromConfig = device?.config?.actuators;

  const base =
    (fromControl && typeof fromControl === "object" ? fromControl : null) ||
    (fromConfig && typeof fromConfig === "object" ? fromConfig : null) ||
    {};

  const out = {};
  for (const [k, v] of Object.entries(base)) {
    const state = (v?.state ?? "OFF").toString().toUpperCase();
    out[k] = {
      state: state === "ON" ? "ON" : "OFF",
      auto: Boolean(v?.auto ?? false),
    };
  }
  return out;
}

function labelize(key) {
  const customMap = {
    t: "Water Temperature",
    temp: "Water Temperature",
    ldr: "Light Level (Lux)",
    light: "Light Level (Lux)",
    flow: "Water Flow",
    air: "Aeration Flow",
    flvl: "Water Level",
    level: "Water Level",
    ph: "pH Level",
    tds: "TDS Purity",
    turb: "Turbidity",
    ec: "Conductivity",
    h: "Humidity",
    salinity: "Salinity",
  };
  if (customMap[key.toLowerCase()]) return customMap[key.toLowerCase()];

  return String(key)
    .replaceAll("_", " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, (m) => m.toUpperCase());
}

/* -------------------- Sensor Icons & Themes -------------------- */
function SensorIcon({ k, className = "w-5 h-5" }) {
  const key = String(k).toLowerCase();
  if (key === "t" || key.includes("temp")) return <Thermometer className={className} />;
  if (key === "ldr" || key.includes("light")) return <Sun className={className} />;
  if (key.includes("flow") || key.includes("water")) return <Waves className={className} />;
  if (key.includes("air")) return <Wind className={className} />;
  if (key.includes("flvl") || key.includes("level")) return <Gauge className={className} />;
  if (key.includes("ph")) return <Droplet className={className} />;
  return <Activity className={className} />;
}

function getSensorTheme(k) {
  const key = String(k).toLowerCase();
  if (key === "t" || key.includes("temp")) {
    return {
      glow: "from-amber-950/40 via-[#07192c] to-[#04101e]",
      border: "border-amber-500/30 hover:border-amber-400/70",
      accent: "text-amber-400",
      unit: "°C",
    };
  }
  if (key === "ldr" || key.includes("light")) {
    return {
      glow: "from-yellow-950/40 via-[#07192c] to-[#04101e]",
      border: "border-yellow-500/30 hover:border-yellow-400/70",
      accent: "text-yellow-400",
      unit: "lux",
    };
  }
  if (key.includes("flow") || key.includes("water")) {
    return {
      glow: "from-cyan-950/40 via-[#07192c] to-[#04101e]",
      border: "border-cyan-500/30 hover:border-cyan-400/70",
      accent: "text-cyan-400",
      unit: "L/m",
    };
  }
  if (key.includes("air")) {
    return {
      glow: "from-teal-950/40 via-[#07192c] to-[#04101e]",
      border: "border-teal-500/30 hover:border-teal-400/70",
      accent: "text-teal-400",
      unit: "",
    };
  }
  if (key === "h" || key.includes("hum")) {
    return {
      glow: "from-blue-950/40 via-[#07192c] to-[#04101e]",
      border: "border-blue-500/30 hover:border-blue-400/70",
      accent: "text-blue-400",
      unit: "%",
    };
  }
  if (key === "tds" || key.includes("tds")) {
    return {
      glow: "from-indigo-950/40 via-[#07192c] to-[#04101e]",
      border: "border-indigo-500/30 hover:border-indigo-400/70",
      accent: "text-indigo-400",
      unit: "ppm",
    };
  }
  return {
    glow: "from-slate-900/60 via-[#07192c] to-[#04101e]",
    border: "border-white/15 hover:border-cyan-400/60",
    accent: "text-cyan-400",
    unit: "",
  };
}

function ActuatorIcon({ k, className = "w-5 h-5", isOn = false }) {
  const key = String(k).toLowerCase();
  if (key.includes("feed") || key.includes("food")) return <Utensils className={className} />;
  if (key.includes("pump") || key.includes("water")) return <Waves className={className} />;
  if (key.includes("air")) return <Wind className={className} />;
  if (key.includes("heat") || key.includes("heater")) return <Flame className={className} />;
  if (key.includes("light") || key.includes("led")) return <Lightbulb className={className} />;
  if (key.includes("fan")) {
    return <Fan className={`${className} ${isOn ? "animate-spin-fast text-teal-300" : ""}`} />;
  }
  return <Power className={className} />;
}

function extractDisplaySensorsFromLatest(latest) {
  const out = [];
  if (!latest || typeof latest !== "object") return out;

  for (const [k, v] of Object.entries(latest)) {
    if (
      ["_id", "id", "deviceId", "up", "ts", "timestamp", "createdAt", "updatedAt", "_ts"].includes(
        k
      )
    )
      continue;

    if (v !== undefined && v !== null && v !== "" && typeof v !== "object") {
      out.push([k, v]);
    }
  }

  return out;
}

function extractNumericFields(entry) {
  const out = {};
  if (!entry || typeof entry !== "object") return out;

  for (const [k, v] of Object.entries(entry)) {
    if (v == null) continue;
    if (typeof v === "number") out[k] = v;
    else if (typeof v === "string") {
      const n = Number(v);
      if (!Number.isNaN(n) && v.trim() !== "") out[k] = n;
    }
  }
  return out;
}

/* -------------------- Advanced Sensor Chart Modal -------------------- */
function SensorChartModal({ open, sensorKey, points = [], onClose }) {
  const [timeRange, setTimeRange] = useState("24H"); // "1H" | "24H" | "7D" | "ALL"
  const [pointLimit, setPointLimit] = useState("ALL"); // "500" | "1000" | "2500" | "ALL"
  const theme = getSensorTheme(sensorKey);

  const w = 840;
  const h = 320;
  const padLeft = 46;
  const padRight = 24;
  const padTop = 28;
  const padBottom = 38;

  const now = useMemo(() => Date.now(), []);

  // Filter data by selected time range dynamically
  const filteredData = useMemo(() => {
    if (!points || !points.length) return [];
    if (timeRange === "ALL") return points;

    const msMap = {
      "1H": 1 * 60 * 60 * 1000,
      "24H": 24 * 60 * 60 * 1000,
      "7D": 7 * 24 * 60 * 60 * 1000,
    };

    const threshold = now - (msMap[timeRange] || 24 * 60 * 60 * 1000);
    const inRange = points.filter((p) => p.t >= threshold);

    // If no points in strict time window, fallback to all points so chart is never empty
    return inRange.length > 0 ? inRange : points;
  }, [points, timeRange, now]);

  // Dynamically deliver data points based on requested limit
  const data = useMemo(() => {
    if (pointLimit === "ALL") return filteredData;
    const limit = Number(pointLimit) || 500;
    return filteredData.slice(-limit);
  }, [filteredData, pointLimit]);
  const values = useMemo(() => data.map((p) => p.v), [data]);
  const times = useMemo(() => data.map((p) => p.t), [data]);

  const minV = useMemo(() => (values.length ? Math.min(...values) : 0), [values]);
  const maxV = useMemo(() => (values.length ? Math.max(...values) : 1), [values]);
  const spanV = maxV - minV || 1;

  const avgV = useMemo(() => {
    if (!values.length) return 0;
    const sum = values.reduce((a, b) => a + b, 0);
    return Number((sum / values.length).toFixed(2));
  }, [values]);

  const minT = useMemo(() => (times.length ? Math.min(...times) : now - 1000), [times, now]);
  const maxT = useMemo(() => (times.length ? Math.max(...times) : now), [times, now]);
  const spanT = maxT - minT || 1;

  const toX = useCallback(
    (t) => padLeft + ((t - minT) / spanT) * (w - padLeft - padRight),
    [minT, spanT]
  );
  const toY = useCallback(
    (v) => h - padBottom - ((v - minV) / spanV) * (h - padTop - padBottom),
    [minV, spanV]
  );

  const path = useMemo(() => {
    return data
      .map((p, i) => `${i === 0 ? "M" : "L"} ${toX(p.t).toFixed(1)} ${toY(p.v).toFixed(1)}`)
      .join(" ");
  }, [data, toX, toY]);

  const areaPath = useMemo(() => {
    if (!data.length) return "";
    const firstX = toX(data[0].t).toFixed(1);
    const lastX = toX(data[data.length - 1].t).toFixed(1);
    const bottomY = (h - padBottom).toFixed(1);
    return `${path} L ${lastX} ${bottomY} L ${firstX} ${bottomY} Z`;
  }, [data, path, toX]);

  const svgRef = useRef(null);
  const [hover, setHover] = useState(null);
  const rafId = useRef(null);

  const findNearestIndexByX = useCallback(
    (xSvg) => {
      if (!data.length) return null;
      const tHover = minT + ((xSvg - padLeft) / (w - padLeft - padRight)) * spanT;

      let lo = 0;
      let hi = data.length - 1;
      while (lo < hi) {
        const mid = Math.floor((lo + hi) / 2);
        if (data[mid].t < tHover) lo = mid + 1;
        else hi = mid;
      }
      const i1 = lo;
      const i0 = Math.max(0, lo - 1);
      const d0 = Math.abs(data[i0].t - tHover);
      const d1 = Math.abs(data[i1].t - tHover);
      return d0 <= d1 ? i0 : i1;
    },
    [data, minT, spanT]
  );

  const handleMove = useCallback(
    (clientX) => {
      if (rafId.current) cancelAnimationFrame(rafId.current);

      rafId.current = requestAnimationFrame(() => {
        const svg = svgRef.current;
        if (!svg || data.length < 2) return;

        const rect = svg.getBoundingClientRect();
        const px = clientX - rect.left;
        const xSvg = (px / rect.width) * w;
        const xClamped = Math.max(padLeft, Math.min(w - padRight, xSvg));

        const idx = findNearestIndexByX(xClamped);
        if (idx == null) return;

        const p = data[idx];
        setHover({
          i: idx,
          x: toX(p.t),
          y: toY(p.v),
          t: p.t,
          v: p.v,
        });
      });
    },
    [data, findNearestIndexByX, toX, toY]
  );

  // Formatted X-axis time ticks (4 ticks)
  const timeTicks = useMemo(() => {
    if (data.length < 2) return [];
    return [0, 0.33, 0.66, 1].map((pct) => {
      const t = minT + pct * spanT;
      const d = new Date(t);
      const label =
        timeRange === "7D"
          ? `${d.toLocaleDateString([], { month: "short", day: "numeric" })} ${d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
          : d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
      return {
        x: padLeft + pct * (w - padLeft - padRight),
        label,
      };
    });
  }, [minT, spanT, timeRange, data.length]);

  if (!open) return null;

  const currentVal = data.length ? data[data.length - 1].v : "—";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-xl p-4 sm:p-6 animate-fade-in">
      <div className="w-full max-w-4xl glass-panel p-6 sm:p-8 bg-[#051424]/95 border-white/20 shadow-2xl rounded-3xl relative overflow-hidden">
        {/* Header with Title & Range Switcher */}
        <div className="mb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <SensorIcon k={sensorKey} className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-cyan-300 uppercase tracking-wider">
                  Telemetry Trend
                </span>
                <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded-full text-slate-300">
                  {data.length} data points
                </span>
              </div>
              <h3 className="text-2xl font-extrabold text-white">{labelize(sensorKey)}</h3>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Dynamic Points Resolution Selector */}
            <div className="hidden sm:flex items-center bg-white/5 px-2.5 py-1 rounded-xl border border-white/10 text-xs">
              <span className="text-slate-400 mr-1.5 font-medium">Resolution:</span>
              <select
                value={pointLimit}
                onChange={(e) => setPointLimit(e.target.value)}
                className="bg-transparent text-cyan-300 font-bold focus:outline-none cursor-pointer text-xs"
              >
                <option value="ALL" className="bg-[#051424] text-white">
                  All ({filteredData.length} pts)
                </option>
                <option value="2500" className="bg-[#051424] text-white">
                  Max 2,500 pts
                </option>
                <option value="1000" className="bg-[#051424] text-white">
                  Max 1,000 pts
                </option>
                <option value="500" className="bg-[#051424] text-white">
                  Max 500 pts
                </option>
              </select>
            </div>

            {/* Time Range Filter Buttons (1H, 24H, 7D, ALL) */}
            <div className="flex items-center bg-white/5 p-1 rounded-xl border border-white/10">
              {[
                { key: "1H", label: "1 Hour" },
                { key: "24H", label: "24 Hours" },
                { key: "7D", label: "7 Days" },
                { key: "ALL", label: "All" },
              ].map((r) => (
                <button
                  key={r.key}
                  onClick={() => setTimeRange(r.key)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    timeRange === r.key
                      ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-sm"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  {r.key}
                </button>
              ))}
            </div>

            <button
              onClick={onClose}
              className="p-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Statistical Summary Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-5">
          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10">
            <span className="text-[11px] font-semibold text-slate-400 block">Latest Reading</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-xl font-extrabold text-cyan-300">{currentVal}</span>
              {theme.unit && <span className="text-xs text-cyan-200/70">{theme.unit}</span>}
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10">
            <span className="text-[11px] font-semibold text-slate-400 block">Window Average</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-xl font-extrabold text-blue-300">{avgV}</span>
              {theme.unit && <span className="text-xs text-cyan-200/70">{theme.unit}</span>}
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10">
            <span className="text-[11px] font-semibold text-slate-400 block">Peak (Max)</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-xl font-extrabold text-amber-300">{maxV}</span>
              {theme.unit && <span className="text-xs text-cyan-200/70">{theme.unit}</span>}
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10">
            <span className="text-[11px] font-semibold text-slate-400 block">Lowest (Min)</span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-xl font-extrabold text-emerald-300">{minV}</span>
              {theme.unit && <span className="text-xs text-cyan-200/70">{theme.unit}</span>}
            </div>
          </div>
        </div>

        {/* SVG Continuous Interactive Chart */}
        <div className="relative rounded-2xl bg-[#020b14] border border-white/10 p-4">
          {data.length < 2 ? (
            <div className="h-[280px] flex items-center justify-center text-sm text-cyan-200/60">
              No historical data points in the selected {timeRange} window.
            </div>
          ) : (
            <>
              <svg
                ref={svgRef}
                viewBox={`0 0 ${w} ${h}`}
                className="w-full h-[280px] cursor-crosshair"
                role="img"
                onMouseMove={(e) => handleMove(e.clientX)}
                onMouseLeave={() => setHover(null)}
                onTouchStart={(e) => {
                  const t = e.touches?.[0];
                  if (t) handleMove(t.clientX);
                }}
                onTouchMove={(e) => {
                  const t = e.touches?.[0];
                  if (t) handleMove(t.clientX);
                }}
                onTouchEnd={() => setHover(null)}
              >
                <defs>
                  <linearGradient id="chartWaveGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.45" />
                    <stop offset="70%" stopColor="#0891b2" stopOpacity="0.1" />
                    <stop offset="100%" stopColor="#0891b2" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Horizontal Grid lines */}
                {Array.from({ length: 4 }).map((_, i) => {
                  const y = padTop + (i * (h - padTop - padBottom)) / 3;
                  const valStep = maxV - (i * spanV) / 3;
                  return (
                    <g key={i}>
                      <line
                        x1={padLeft}
                        y1={y}
                        x2={w - padRight}
                        y2={y}
                        stroke="rgba(255, 255, 255, 0.08)"
                        strokeDasharray="4 4"
                      />
                      <text
                        x={padLeft - 8}
                        y={y + 4}
                        fill="rgba(255,255,255,0.4)"
                        fontSize="10"
                        fontWeight="600"
                        textAnchor="end"
                      >
                        {valStep.toFixed(1)}
                      </text>
                    </g>
                  );
                })}

                {/* X-axis Time Tick Labels */}
                {timeTicks.map((tick, i) => (
                  <g key={i}>
                    <line
                      x1={tick.x}
                      y1={h - padBottom}
                      x2={tick.x}
                      y2={h - padBottom + 4}
                      stroke="rgba(255, 255, 255, 0.2)"
                    />
                    <text
                      x={tick.x}
                      y={h - padBottom + 16}
                      fill="rgba(255,255,255,0.45)"
                      fontSize="10"
                      fontWeight="500"
                      textAnchor={i === 0 ? "start" : i === timeTicks.length - 1 ? "end" : "middle"}
                    >
                      {tick.label}
                    </text>
                  </g>
                ))}

                {/* Area & Line */}
                <path d={areaPath} fill="url(#chartWaveGradient)" />
                <path
                  d={path}
                  fill="none"
                  stroke="#22d3ee"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Hover Scrubber Line & Circle */}
                {hover && (
                  <>
                    <line
                      x1={hover.x}
                      y1={padTop}
                      x2={hover.x}
                      y2={h - padBottom}
                      stroke="rgba(34, 211, 238, 0.8)"
                      strokeWidth="2"
                      strokeDasharray="3 3"
                    />
                    <circle
                      cx={hover.x}
                      cy={hover.y}
                      r="6"
                      fill="#ffffff"
                      stroke="#0891b2"
                      strokeWidth="3"
                    />
                    <circle
                      cx={hover.x}
                      cy={hover.y}
                      r="12"
                      fill="rgba(34, 211, 238, 0.25)"
                    />
                  </>
                )}
              </svg>

              {/* Floating Full Hover Tooltip HUD */}
              {hover && (
                <div className="pointer-events-none absolute left-6 top-6 glass-panel px-4 py-2.5 bg-[#051424]/95 border-cyan-400/50 text-xs shadow-2xl backdrop-blur-xl rounded-2xl min-w-[160px]">
                  <div className="flex items-center justify-between gap-2 text-cyan-300 font-semibold border-b border-white/10 pb-1 mb-1">
                    <span>{labelize(sensorKey)}</span>
                    <span className="text-[10px] text-slate-400">#{hover.i + 1}</span>
                  </div>
                  <div className="text-xl font-black text-white">
                    {hover.v} {theme.unit}
                  </div>
                  <div className="text-[10px] text-slate-300 mt-1 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-cyan-400" />
                    <span>
                      {new Date(hover.t).toLocaleDateString([], { month: "short", day: "numeric" })}{" "}
                      {fmtTime(hover.t)}
                    </span>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* -------------------- Interactive Swipe To Feed Component -------------------- */
function SwipeToFeed({ onFeed, feeding, disabled, countdown }) {
  const [dragProgress, setDragProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const trackRef = useRef(null);

  const handleStart = () => {
    if (disabled || feeding) return;
    setIsDragging(true);
  };

  const handleMove = (clientX) => {
    if (!isDragging || disabled || feeding || !trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const width = rect.width - 44;
    const currentX = clientX - rect.left - 20;
    const progress = Math.max(0, Math.min(1, currentX / width));
    setDragProgress(progress);

    if (progress >= 0.85) {
      setIsDragging(false);
      setDragProgress(1);
      onFeed();
    }
  };

  const handleEnd = () => {
    if (!feeding) {
      setDragProgress(0);
    }
    setIsDragging(false);
  };

  useEffect(() => {
    if (!feeding) {
      setDragProgress(0);
    } else {
      setDragProgress(1);
    }
  }, [feeding]);

  return (
    <div
      ref={trackRef}
      onMouseMove={(e) => handleMove(e.clientX)}
      onMouseUp={handleEnd}
      onMouseLeave={handleEnd}
      onTouchMove={(e) => e.touches?.[0] && handleMove(e.touches[0].clientX)}
      onTouchEnd={handleEnd}
      className={`relative w-full h-11 rounded-2xl overflow-hidden select-none border transition-all ${
        disabled
          ? "bg-white/5 border-white/5 opacity-50 cursor-not-allowed"
          : feeding
          ? "bg-amber-500/20 border-amber-400/50 shadow-lg shadow-amber-500/20"
          : "bg-white/5 border-white/10 hover:border-cyan-400/40 cursor-pointer"
      }`}
    >
      {/* Background Liquid Wave Fill during feeding */}
      {feeding && (
        <div className="absolute inset-0 bg-gradient-to-r from-amber-500/35 via-orange-500/35 to-amber-500/35 animate-pulse" />
      )}

      {/* Track Label */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-xs font-bold text-cyan-200/80">
        {feeding ? (
          <span className="flex items-center gap-1.5 text-amber-300 font-extrabold animate-pulse">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Dispensing Food ({countdown || 4}s)...</span>
          </span>
        ) : disabled ? (
          <span className="text-slate-500 flex items-center gap-1">
            <Lock className="w-3 h-3" />
            <span>Locked in Auto Mode</span>
          </span>
        ) : (
          <span className="flex items-center gap-1.5">
            <span>Swipe to Feed</span>
            <span className="animate-pulse text-cyan-400">➔</span>
          </span>
        )}
      </div>

      {/* Swipe Puck */}
      {!disabled && (
        <div
          onMouseDown={handleStart}
          onTouchStart={handleStart}
          onClick={(e) => {
            e.stopPropagation();
            if (!feeding && !disabled) {
              setDragProgress(1);
              onFeed();
            }
          }}
          style={{
            transform: `translateX(${
              dragProgress * (trackRef.current ? trackRef.current.clientWidth - 44 : 0)
            }px)`,
            transition: isDragging ? "none" : "transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)",
          }}
          className={`absolute top-1 left-1 w-9 h-9 rounded-xl flex items-center justify-center shadow-md cursor-grab active:cursor-grabbing border ${
            feeding
              ? "bg-gradient-to-tr from-amber-500 to-orange-500 text-black border-amber-300 animate-bounce"
              : "bg-gradient-to-tr from-cyan-500 to-blue-600 text-white border-cyan-300 hover:scale-105"
          }`}
          title={feeding ? "Feeding in progress" : "Drag or Click to Feed"}
        >
          {feeding ? (
            <Sparkles className="w-4 h-4 text-black" />
          ) : (
            <Fish className="w-4 h-4 text-white" />
          )}
        </div>
      )}
    </div>
  );
}

/* -------------------- Main Device Detail Page -------------------- */
export default function DeviceDetailPage() {
  const { deviceId } = useParams();
  const router = useRouter();

  const [device, setDevice] = useState(null);
  const [telemetryList, setTelemetryList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const [openSensor, setOpenSensor] = useState(null);
  const [savingAct, setSavingAct] = useState({});
  const lastTelemetryFingerprint = useRef("");

  const fetchAll = useCallback(
    async ({ silent = false } = {}) => {
      try {
        if (!silent) {
          setRefreshing(true);
          setError("");
        }

        const dev = await apiGet(`/api/devices/${deviceId}`);
        setDevice(normalizeDevice(dev));

        const tlm = await apiGet(`/api/devices/${deviceId}/telemetry?limit=10000`);
        const list =
          tlm?.items ?? tlm?.telemetry ?? tlm?.data ?? (Array.isArray(tlm) ? tlm : []);

        const sorted = [...list].sort((a, b) => {
          const ta = getEntryTimeMs(a) ?? 0;
          const tb = getEntryTimeMs(b) ?? 0;
          return tb - ta;
        });

        const currentFingerprint = `${sorted.length}_${getEntryTimeMs(sorted[0]) || 0}`;
        if (currentFingerprint !== lastTelemetryFingerprint.current || !silent) {
          lastTelemetryFingerprint.current = currentFingerprint;
          setTelemetryList(sorted);
        }
      } catch (e) {
        const msg = e?.message || "Failed to load device telemetry";
        setError(msg);

        if (String(msg).toLowerCase().includes("unauthorized")) {
          removeToken();
          router.replace("/login");
        }
      } finally {
        if (!silent) setRefreshing(false);
        setLoading(false);
      }
    },
    [deviceId, router]
  );

  useEffect(() => {
    fetchAll({ silent: false });
  }, [fetchAll]);

  useEffect(() => {
    const id = setInterval(() => fetchAll({ silent: true }), 2500);
    return () => clearInterval(id);
  }, [fetchAll]);

  const latestEntry = telemetryList?.[0] ?? null;
  const latestTimeMs = getEntryTimeMs(latestEntry);
  const latestTimeLabel = latestTimeMs ? fmtTime(latestTimeMs) : "—";
  const online = useMemo(() => isOnlineByLatest(latestEntry, 2), [latestEntry]);

  const title =
    device?.config?.device?.name ||
    device?.name ||
    device?.deviceName ||
    `Device ${deviceId}`;

  const sensorCards = useMemo(
    () => extractDisplaySensorsFromLatest(latestEntry),
    [latestEntry]
  );

  const series = useMemo(() => {
    const map = {};
    for (const entry of telemetryList || []) {
      const t = getEntryTimeMs(entry);
      if (!t) continue;

      const nums = extractNumericFields(entry);
      for (const [k, v] of Object.entries(nums)) {
        if (!map[k]) map[k] = [];
        map[k].push({ t, v: Number(v) });
      }
    }
    for (const k of Object.keys(map)) map[k].sort((a, b) => a.t - b.t);
    return map;
  }, [telemetryList]);

  const actuators = useMemo(() => normalizeActuators(device), [device]);

  const sendControl = useCallback(
    async (body) => {
      setError("");
      return apiPost(`/api/devices/${deviceId}/control`, body);
    },
    [deviceId]
  );

  const toggleActState = async (name) => {
    const current = actuators?.[name] || { state: "OFF", auto: false };
    const nextState = current.state === "ON" ? "OFF" : "ON";

    setDevice((prev) => {
      const copy = structuredClone(prev || {});
      copy.control = copy.control || {};
      copy.control.actuators = copy.control.actuators || {};
      copy.control.actuators[name] = { ...current, state: nextState };
      return copy;
    });

    setSavingAct((s) => ({ ...s, [name]: "state" }));
    try {
      await sendControl({ actuators: { [name]: { state: nextState, auto: current.auto } } });
      fetchAll({ silent: true });
    } catch (e) {
      setError(e?.message || `Failed to update ${name}`);
      fetchAll({ silent: true });
    } finally {
      setSavingAct((s) => ({ ...s, [name]: null }));
    }
  };

  const toggleActAuto = async (name) => {
    const current = actuators?.[name] || { state: "OFF", auto: false };
    const nextAuto = !current.auto;

    setDevice((prev) => {
      const copy = structuredClone(prev || {});
      copy.control = copy.control || {};
      copy.control.actuators = copy.control.actuators || {};
      copy.control.actuators[name] = { ...current, auto: nextAuto };
      return copy;
    });

    setSavingAct((s) => ({ ...s, [name]: "auto" }));
    try {
      await sendControl({ actuators: { [name]: { state: current.state, auto: nextAuto } } });
      fetchAll({ silent: true });
    } catch (e) {
      setError(e?.message || `Failed to toggle auto for ${name}`);
      fetchAll({ silent: true });
    } finally {
      setSavingAct((s) => ({ ...s, [name]: null }));
    }
  };

  // Feeder Pulse Countdown state
  const [feedingCountdowns, setFeedingCountdowns] = useState({});
  const feedTimersRef = useRef({});

  const handleFeedPulse = useCallback(
    async (name, pulseSec = 4) => {
      if (feedingCountdowns[name]) return;

      setError("");
      setFeedingCountdowns((prev) => ({ ...prev, [name]: pulseSec }));

      // Optimistic ON
      setDevice((prev) => {
        const copy = structuredClone(prev || {});
        copy.control = copy.control || {};
        copy.control.actuators = copy.control.actuators || {};
        copy.control.actuators[name] = { state: "ON", auto: false };
        return copy;
      });

      try {
        await sendControl({ actuators: { [name]: { state: "ON", auto: false } } });
      } catch (e) {
        setError(e?.message || `Failed to trigger feeder`);
      }

      // Start countdown
      let remaining = pulseSec;
      if (feedTimersRef.current[name]) clearInterval(feedTimersRef.current[name]);

      feedTimersRef.current[name] = setInterval(async () => {
        remaining -= 1;
        if (remaining > 0) {
          setFeedingCountdowns((prev) => ({ ...prev, [name]: remaining }));
        } else {
          clearInterval(feedTimersRef.current[name]);
          delete feedTimersRef.current[name];
          setFeedingCountdowns((prev) => {
            const copy = { ...prev };
            delete copy[name];
            return copy;
          });

          // Turn OFF automatically and return slider
          setDevice((prev) => {
            const copy = structuredClone(prev || {});
            copy.control = copy.control || {};
            copy.control.actuators = copy.control.actuators || {};
            copy.control.actuators[name] = { state: "OFF", auto: false };
            return copy;
          });

          try {
            await sendControl({ actuators: { [name]: { state: "OFF", auto: false } } });
            fetchAll({ silent: true });
          } catch (e) {
            setError(e?.message || `Failed to reset feeder`);
          }
        }
      }, 1000);
    },
    [feedingCountdowns, sendControl, fetchAll]
  );

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      for (const t of Object.values(feedTimersRef.current)) {
        if (t) clearInterval(t);
      }
    };
  }, []);

  if (loading) {
    return (
      <div className="relative min-h-screen px-4 sm:px-8 max-w-7xl mx-auto flex items-center justify-center">
        <AquariumBackground showSeabed={true} density="sparse" subtle={true} />
        <AquariumLoader
          title="Connecting to Aquarium"
          subtitle="Calibrating live sensor probes and telemetry stream..."
          fullScreen={false}
        />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen px-4 sm:px-8 pb-16 max-w-7xl mx-auto space-y-8">
      {/* 🌊 Subtle Marine Background */}
      <AquariumBackground showSeabed={true} density="sparse" subtle={true} />

      {/* 🌟 Header Bar with simplified 'Online' label */}
      <div className="relative z-10 glass-panel p-6 sm:p-7 bg-[#05172a]/92 border-white/15 shadow-2xl backdrop-blur-2xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="space-y-1.5">
            <Link
              href="/home"
              className="inline-flex items-center gap-2 text-xs font-semibold text-cyan-300 hover:text-white transition group mb-0.5"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              <span>Back to Aquariums</span>
            </Link>

            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                {title}
              </h1>

              {/* Clean 'Online' / 'Offline' Label */}
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${
                  online
                    ? "bg-emerald-500/20 text-emerald-300 border-emerald-400/40 shadow-sm shadow-emerald-500/20"
                    : "bg-rose-500/20 text-rose-300 border-rose-400/40"
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    online ? "bg-emerald-400 animate-pulse" : "bg-rose-400"
                  }`}
                />
                <span>{online ? "Online" : "Offline"}</span>
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-3 text-xs text-cyan-100/70 pt-0.5">
              <span className="font-mono bg-white/5 px-2 py-0.5 rounded-lg border border-white/10">
                {deviceId}
              </span>
              <span className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-cyan-300" />
                <span>Last Seen: {latestTimeLabel}</span>
              </span>
            </div>
          </div>

          {/* Quick Refresh */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => fetchAll({ silent: false })}
              disabled={refreshing}
              className="btn-aquatic py-2 px-4 text-xs font-semibold"
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
              <span>{refreshing ? "Syncing..." : "Sync"}</span>
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-4 p-3.5 rounded-2xl bg-rose-500/20 text-rose-200 text-sm border border-rose-500/30 flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => fetchAll({ silent: false })} className="text-xs font-bold underline">
              Retry
            </button>
          </div>
        )}
      </div>

      {/* 📊 SECTION 1: Vital Sensors (No extra chart badge, card click opens chart) */}
      <div className="relative z-10 space-y-3.5">
        <h2 className="text-lg font-bold text-white tracking-tight">Sensors</h2>

        {sensorCards.length === 0 ? (
          <div className="glass-panel p-8 text-center text-cyan-100/60 bg-[#05172a]/92 backdrop-blur-2xl">
            Waiting for live sensor data...
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
            {sensorCards.map(([k, v]) => {
              const theme = getSensorTheme(k);
              const hasChart = Boolean(series?.[k]?.length);

              return (
                <button
                  key={k}
                  onClick={() => hasChart && setOpenSensor(k)}
                  className={`glass-panel p-4 text-left bg-gradient-to-b ${theme.glow} border ${theme.border} backdrop-blur-2xl transition-all duration-200 group relative rounded-2xl ${
                    hasChart ? "cursor-pointer hover:scale-[1.02]" : "cursor-default"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`p-1.5 rounded-xl bg-white/10 ${theme.accent}`}>
                      <SensorIcon k={k} className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-medium text-slate-300 truncate">
                      {labelize(k)}
                    </span>
                  </div>

                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-2xl font-bold text-white tracking-tight">
                      {String(v)}
                    </span>
                    {theme.unit && (
                      <span className="text-xs font-medium text-cyan-200/70">{theme.unit}</span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* 🎛️ SECTION 2: Actuator Controls (Clean, non-industrial, Auto with icon & disable manual) */}
      <div className="relative z-10 space-y-3.5">
        <h2 className="text-lg font-bold text-white tracking-tight">Controls</h2>

        {Object.keys(actuators).length === 0 ? (
          <div className="glass-panel p-8 text-center text-cyan-100/60 bg-[#05172a]/92 backdrop-blur-2xl">
            No actuators found.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Object.entries(actuators).map(([name, a]) => {
              const busy = Boolean(savingAct[name]);
              const on = a.state === "ON";
              const isAuto = Boolean(a.auto);

              return (
                <div
                  key={name}
                  className={`glass-panel p-5 rounded-2xl border backdrop-blur-2xl transition-all ${
                    on
                      ? "bg-[#061e36]/90 border-emerald-500/30 shadow-lg shadow-emerald-950/30"
                      : "bg-[#05172a]/90 border-white/10"
                  }`}
                >
                  {/* Header Row */}
                  <div className="flex items-center justify-between gap-3 mb-4">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${
                          on
                            ? "bg-emerald-500/20 text-emerald-300"
                            : "bg-white/5 text-slate-400"
                        }`}
                      >
                        <ActuatorIcon k={name} className="w-5 h-5" isOn={on} />
                      </div>
                      <div>
                        <h3 className="text-base font-semibold text-white">{labelize(name)}</h3>
                        <span className="text-[11px] text-cyan-200/60 block">
                          {isAuto ? "Automatic mode" : "Manual mode"}
                        </span>
                      </div>
                    </div>

                    {/* Status Pill */}
                    <span
                      className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                        on
                          ? "bg-emerald-500/20 text-emerald-300"
                          : "bg-white/5 text-slate-400"
                      }`}
                    >
                      {on ? "ON" : "OFF"}
                    </span>
                  </div>

                  {/* Actuator Action Controls */}
                  <div className="pt-3 border-t border-white/10 space-y-2.5">
                    {/* If Feeder Actuator: Render Interactive Swipe To Feed Slider */}
                    {name.toLowerCase().includes("feed") || name.toLowerCase().includes("food") ? (
                      <div className="space-y-2">
                        <SwipeToFeed
                          onFeed={() => handleFeedPulse(name, 4)}
                          feeding={Boolean(feedingCountdowns[name])}
                          disabled={isAuto}
                          countdown={feedingCountdowns[name]}
                        />

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => toggleActAuto(name)}
                            disabled={Boolean(busy) || Boolean(feedingCountdowns[name])}
                            className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1.5 border cursor-pointer ${
                              isAuto
                                ? "bg-cyan-500/20 text-cyan-200 border-cyan-400/40"
                                : "bg-white/5 text-slate-300 border-white/10 hover:bg-white/10"
                            }`}
                          >
                            <Bot className="w-3.5 h-3.5" />
                            <span>{isAuto ? "Auto ON" : "Auto OFF"}</span>
                          </button>

                          <button
                            onClick={() => router.push(`/devices/${deviceId}/actuators/${name}/schedule`)}
                            className="p-1.5 px-3 rounded-xl bg-white/5 hover:bg-white/15 text-slate-300 hover:text-white border border-white/10 transition cursor-pointer text-xs font-semibold flex items-center gap-1"
                            title="Manage Feeding Schedule"
                          >
                            <Calendar className="w-3.5 h-3.5 text-cyan-300" />
                            <span>Schedule</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      /* Standard Actuator Buttons (Power + Auto + Schedule) */
                      <div className="flex items-center gap-2">
                        {/* Auto Toggle Button with Icon & Liquid Fill Effect */}
                        <button
                          onClick={() => toggleActAuto(name)}
                          disabled={Boolean(busy)}
                          title={isAuto ? "Switch to Manual Control" : "Switch to Automatic Schedule"}
                          className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer border ${
                            busy === "auto"
                              ? "btn-liquid-filling text-white border-cyan-300"
                              : isAuto
                              ? "bg-cyan-500/20 text-cyan-200 border-cyan-400/40 hover:bg-cyan-500/30 shadow-sm"
                              : "bg-white/5 text-slate-300 border-white/10 hover:bg-white/10"
                          }`}
                        >
                          {busy === "auto" ? (
                            <div className="relative z-10 flex items-center gap-1.5 text-white">
                              <Waves className="w-3.5 h-3.5 animate-pulse text-cyan-200" />
                              <span>Syncing...</span>
                            </div>
                          ) : (
                            <>
                              <Bot className="w-3.5 h-3.5" />
                              <span>{isAuto ? "Auto ON" : "Auto OFF"}</span>
                            </>
                          )}
                        </button>

                        {/* Manual Power Button with Liquid Wave Filling Animation */}
                        <button
                          onClick={() => !isAuto && toggleActState(name)}
                          disabled={isAuto || Boolean(busy)}
                          title={
                            isAuto
                              ? "Manual power is locked while Auto mode is active"
                              : on
                              ? "Turn Off"
                              : "Turn On"
                          }
                          className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold transition flex items-center justify-center gap-1.5 border ${
                            busy === "state"
                              ? "btn-liquid-filling text-white border-cyan-300 shadow-md"
                              : isAuto
                              ? "bg-white/5 text-slate-500 border-white/5 cursor-not-allowed opacity-50"
                              : on
                              ? "bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 border-rose-500/40 cursor-pointer"
                              : "bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-200 border-emerald-500/40 cursor-pointer"
                          }`}
                        >
                          {busy === "state" ? (
                            <div className="relative z-10 flex items-center gap-1.5 text-white">
                              <Waves className="w-3.5 h-3.5 animate-pulse text-cyan-200" />
                              <span>Filling...</span>
                            </div>
                          ) : isAuto ? (
                            <>
                              <Lock className="w-3.5 h-3.5" />
                              <span>Locked</span>
                            </>
                          ) : (
                            <>
                              <Power className="w-3.5 h-3.5" />
                              <span>{on ? "Off" : "On"}</span>
                            </>
                          )}
                        </button>

                        {/* Schedule Manager Link */}
                        <button
                          onClick={() => router.push(`/devices/${deviceId}/actuators/${name}/schedule`)}
                          className="p-2 rounded-xl bg-white/5 hover:bg-white/15 text-slate-300 hover:text-white border border-white/10 transition cursor-pointer"
                          title="Manage Actuator Schedule"
                        >
                          <Calendar className="w-4 h-4 text-cyan-300" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Sensor History Modal */}
      <SensorChartModal
        open={Boolean(openSensor)}
        sensorKey={openSensor || ""}
        points={openSensor ? series?.[openSensor] : []}
        onClose={() => setOpenSensor(null)}
      />
    </div>
  );
}
