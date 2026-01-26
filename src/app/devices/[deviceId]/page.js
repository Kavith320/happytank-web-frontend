"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { apiGet, apiPost } from "../../lib/api";
import { removeToken } from "../../lib/auth";


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
  Wifi,
  WifiOff,
  RefreshCw,
} from "lucide-react";

/* -------------------- Mongo ObjectId time -------------------- */
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
  return d.toLocaleString();
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

  // fallback: ObjectId timestamp
  return timeMsFromObjectId(entry._id);
}

function isOnlineByLatest(latestEntry, minutes = 2) {
  const ms = getEntryTimeMs(latestEntry);
  if (!ms) return false;
  return Date.now() - ms < minutes * 60 * 1000;
}

/* -------------------- normalize -------------------- */
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
  return String(key)
    .replaceAll("_", " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, (m) => m.toUpperCase());
}

/* -------------------- Icons -------------------- */
function SensorIcon({ k, className = "h-5 w-5" }) {
  const key = String(k).toLowerCase();
  if (key === "t" || key.includes("temp")) return <Thermometer className={className} />;
  if (key === "ldr" || key.includes("light")) return <Sun className={className} />;
  if (key.includes("flow")) return <Waves className={className} />;
  if (key.includes("air")) return <Wind className={className} />;
  if (key.includes("flvl") || key.includes("level")) return <Gauge className={className} />;
  return <Activity className={className} />;
}

function ActuatorIcon({ k, className = "h-5 w-5" }) {
  const key = String(k).toLowerCase();
  if (key.includes("pump") && key.includes("water")) return <Droplet className={className} />;
  if (key.includes("air")) return <Wind className={className} />;
  if (key.includes("heat") || key.includes("heater")) return <Flame className={className} />;
  if (key.includes("light") || key.includes("led")) return <Lightbulb className={className} />;
  if (key.includes("fan")) return <Fan className={className} />;
  return <Power className={className} />;
}

/* -------------------- Sensors display + history -------------------- */
// Only show these sensors as cards (latest values)
const SENSOR_KEYS = ["t", "ldr", "flow", "air", "flvl"];

// Graph only numeric sensors (t, ldr). If you want flow/air/flvl as 0/1 graphs, tell me.
const GRAPH_NUMERIC_KEYS = new Set(["t", "ldr"]);

function extractDisplaySensorsFromLatest(latest) {
  const out = [];
  if (!latest || typeof latest !== "object") return out;

  for (const k of SENSOR_KEYS) {
    const v = latest[k];
    if (v === undefined || v === null || v === "") continue;
    if (typeof v === "object") continue;
    out.push([k, v]);
  }
  return out;
}

function extractNumericFields(entry) {
  const out = {};
  if (!entry || typeof entry !== "object") return out;

  for (const [k, v] of Object.entries(entry)) {
    if (!GRAPH_NUMERIC_KEYS.has(k)) continue;

    if (v == null) continue;
    if (typeof v === "number") out[k] = v;
    else if (typeof v === "string") {
      const n = Number(v);
      if (!Number.isNaN(n) && v.trim() !== "") out[k] = n;
    }
  }
  return out;
}

/* -------------------- UI -------------------- */
function Card({ title, right, children }) {
  return (
    <div className="rounded-2xl bg-white/5 ring-1 ring-white/10 p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="text-base font-semibold">{title}</h3>
        {right}
      </div>
      {children}
    </div>
  );
}

/* -------------------- Chart modal with hover tooltip -------------------- */
function SensorChartModal({ open, sensorKey, points, onClose }) {
  const w = 900;
  const h = 320;
  const pad = 30;


  const now = useMemo(() => Date.now(), []);

  const data = useMemo(() => (points || []).slice(-200), [points]);
  const values = useMemo(() => data.map((p) => p.v), [data]);
  const times = useMemo(() => data.map((p) => p.t), [data]);

  const minV = values.length ? Math.min(...values) : 0;
  const maxV = values.length ? Math.max(...values) : 1;
  const spanV = maxV - minV || 1;

  const minT = times.length ? Math.min(...times) : now - 1000;
  const maxT = times.length ? Math.max(...times) : now;
  const spanT = maxT - minT || 1;

  const toX = useCallback(
    (t) => pad + ((t - minT) / spanT) * (w - pad * 2),
    [minT, spanT]
  );
  const toY = useCallback(
    (v) => h - pad - ((v - minV) / spanV) * (h - pad * 2),
    [minV, spanV]
  );

  const path = useMemo(() => {
    return data
      .map((p, i) => `${i === 0 ? "M" : "L"} ${toX(p.t).toFixed(1)} ${toY(p.v).toFixed(1)}`)
      .join(" ");
  }, [data, toX, toY]);

  const svgRef = useRef(null);
  const [hover, setHover] = useState(null);

  const findNearestIndexByX = useCallback(
    (xSvg) => {
      if (!data.length) return null;

      const tHover = minT + ((xSvg - pad) / (w - pad * 2)) * spanT;

      // data assumed sorted by time asc
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
    (clientX, clientY) => {
      const svg = svgRef.current;
      if (!svg || data.length < 2) return;

      const rect = svg.getBoundingClientRect();
      const px = clientX - rect.left;

      const xSvg = (px / rect.width) * w;
      const xClamped = Math.max(pad, Math.min(w - pad, xSvg));

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
    },
    [data, findNearestIndexByX, toX, toY]
  );

  if (!open) return null;

  const last = data[data.length - 1];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="w-full max-w-4xl rounded-2xl bg-zinc-950 ring-1 ring-white/10 p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="mt-1">
              <SensorIcon k={sensorKey} className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xs opacity-70">Sensor Chart</div>
              <div className="text-lg font-semibold">{labelize(sensorKey)}</div>
              <div className="mt-1 text-xs opacity-70">
                Last: <span className="opacity-100">{last ? last.v : "—"}</span> • Range:{" "}
                <span className="opacity-100">
                  {values.length ? `${minV} to ${maxV}` : "—"}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="rounded-xl bg-white/10 hover:bg-white/15 ring-1 ring-white/10 px-3 py-2 text-sm"
          >
            Close
          </button>
        </div>

        <div className="relative rounded-xl bg-black/30 ring-1 ring-white/10 p-3">
          {data.length < 2 ? (
            <div className="h-[320px] flex items-center justify-center text-sm opacity-70">
              Not enough numeric data for this sensor.
            </div>
          ) : (
            <>
              <svg
                ref={svgRef}
                viewBox={`0 0 ${w} ${h}`}
                className="w-full h-[320px]"
                role="img"
                onMouseMove={(e) => handleMove(e.clientX, e.clientY)}
                onMouseLeave={() => setHover(null)}
                onTouchStart={(e) => {
                  const t = e.touches?.[0];
                  if (t) handleMove(t.clientX, t.clientY);
                }}
                onTouchMove={(e) => {
                  const t = e.touches?.[0];
                  if (t) handleMove(t.clientX, t.clientY);
                }}
                onTouchEnd={() => setHover(null)}
              >
                {/* grid */}
                {Array.from({ length: 5 }).map((_, i) => {
                  const y = pad + (i * (h - pad * 2)) / 4;
                  return (
                    <line
                      key={i}
                      x1={pad}
                      y1={y}
                      x2={w - pad}
                      y2={y}
                      stroke="rgba(255,255,255,0.12)"
                      strokeWidth="1"
                    />
                  );
                })}
                {Array.from({ length: 6 }).map((_, i) => {
                  const x = pad + (i * (w - pad * 2)) / 5;
                  return (
                    <line
                      key={i}
                      x1={x}
                      y1={pad}
                      x2={x}
                      y2={h - pad}
                      stroke="rgba(255,255,255,0.08)"
                      strokeWidth="1"
                    />
                  );
                })}

                <path d={path} fill="none" stroke="rgba(255,255,255,0.9)" strokeWidth="2.5" />

                {hover ? (
                  <>
                    <line
                      x1={hover.x}
                      y1={pad}
                      x2={hover.x}
                      y2={h - pad}
                      stroke="rgba(255,255,255,0.25)"
                      strokeWidth="1"
                    />
                    <circle cx={hover.x} cy={hover.y} r="5" fill="rgba(255,255,255,0.95)" />
                  </>
                ) : null}

                <text x={pad} y={pad - 8} fill="rgba(255,255,255,0.6)" fontSize="12">
                  {maxV}
                </text>
                <text x={pad} y={h - 10} fill="rgba(255,255,255,0.6)" fontSize="12">
                  {minV}
                </text>
              </svg>

              {hover ? (
                <div className="pointer-events-none absolute left-3 top-3 rounded-xl bg-black/80 ring-1 ring-white/10 px-3 py-2 text-xs">
                  <div className="opacity-70">{labelize(sensorKey)}</div>
                  <div className="mt-1">
                    <span className="opacity-70">Value: </span>
                    <span className="font-semibold">{hover.v}</span>
                  </div>
                  <div className="mt-0.5">
                    <span className="opacity-70">Time: </span>
                    <span className="font-medium">{fmtTime(hover.t)}</span>
                  </div>
                </div>
              ) : (
                <div className="absolute left-3 top-3 text-xs opacity-70">
                  Hover / drag to see values
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* -------------------- Main Page -------------------- */
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

        setTelemetryList(sorted);
      } catch (e) {
        const msg = e?.message || "Failed to load device/telemetry";
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

  // Poll history endpoint every 1s
  useEffect(() => {
    const id = setInterval(() => fetchAll({ silent: true }), 1000);
    return () => clearInterval(id);
  }, [fetchAll]);

  const latestEntry = telemetryList?.[0] ?? null;
  const latestTimeMs = getEntryTimeMs(latestEntry);
  const latestTimeLabel = latestTimeMs ? fmtTime(latestTimeMs) : "—";
  const online = useMemo(() => isOnlineByLatest(latestEntry, 2), [latestEntry]);

  const title = device?.name || device?.deviceName || `Device ${deviceId}`;

  // Latest sensor cards (no raw, no deviceId/id/up)
  const sensorCards = useMemo(
    () => extractDisplaySensorsFromLatest(latestEntry),
    [latestEntry]
  );

  // Build time series for graphs using full history list
  const series = useMemo(() => {
    const map = {};
    for (const entry of telemetryList || []) {
      const t = getEntryTimeMs(entry);
      if (!t) continue;

      const nums = extractNumericFields(entry); // numeric sensors only
      for (const [k, v] of Object.entries(nums)) {
        if (!map[k]) map[k] = [];
        map[k].push({ t, v: Number(v) });
      }
    }
    // ensure ascending for hover binary search
    for (const k of Object.keys(map)) map[k].sort((a, b) => a.t - b.t);
    return map;
  }, [telemetryList]);

  // Actuators from device meta
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

    // optimistic
    setDevice((prev) => {
      const copy = structuredClone(prev || {});
      copy.control = copy.control || {};
      copy.control.actuators = copy.control.actuators || {};
      copy.control.actuators[name] = { ...current, state: nextState };
      return copy;
    });

    setSavingAct((s) => ({ ...s, [name]: true }));
    try {
      await sendControl({ actuators: { [name]: { state: nextState, auto: current.auto } } });
      fetchAll({ silent: true });
    } catch (e) {
      setError(e?.message || `Failed to control ${name}`);
      fetchAll({ silent: true });
    } finally {
      setSavingAct((s) => ({ ...s, [name]: false }));
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

    setSavingAct((s) => ({ ...s, [name]: true }));
    try {
      await sendControl({ actuators: { [name]: { state: current.state, auto: nextAuto } } });
      fetchAll({ silent: true });
    } catch (e) {
      setError(e?.message || `Failed to update auto for ${name}`);
      fetchAll({ silent: true });
    } finally {
      setSavingAct((s) => ({ ...s, [name]: false }));
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="rounded-2xl bg-white/5 ring-1 ring-white/10 p-6">
          <div className="text-lg font-semibold">Loading device…</div>
          <div className="mt-2 text-sm opacity-70">Fetching telemetry history.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 rounded-2xl bg-white/5 ring-1 ring-white/10 p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="min-w-[220px]">
            <div className="text-xs opacity-70">Device</div>
            <div className="text-xl font-bold">{title}</div>
            <div className="mt-1 text-xs opacity-70">
              Latest telemetry: <span className="opacity-90">{latestTimeLabel}</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span
              className={
                "inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm ring-1 " +
                (online
                  ? "bg-emerald-500/15 text-emerald-200 ring-emerald-400/30"
                  : "bg-rose-500/15 text-rose-200 ring-rose-400/30")
              }
            >
              {online ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
              {online ? "Online" : "Offline"}
            </span>

            <button
              onClick={() => fetchAll({ silent: false })}
              className="rounded-xl bg-white/10 hover:bg-white/15 ring-1 ring-white/10 px-4 py-2 text-sm"
              disabled={refreshing}
            >
              <span className="inline-flex items-center gap-2">
                <RefreshCw className={"h-4 w-4 " + (refreshing ? "animate-spin" : "")} />
                {refreshing ? "Refreshing…" : "Refresh"}
              </span>
            </button>

            <button
              onClick={() => router.push("/home")}
              className="rounded-xl bg-white/10 hover:bg-white/15 ring-1 ring-white/10 px-4 py-2 text-sm"
            >
              Back
            </button>
          </div>
        </div>

        <div className="text-xs opacity-70">
          Loaded history: <span className="opacity-100">{telemetryList?.length || 0}</span> entries
        </div>

        {error ? (
          <div className="rounded-xl bg-rose-500/10 ring-1 ring-rose-400/20 p-3 text-sm text-rose-100">
            {error}
          </div>
        ) : null}
      </div>

      {/* Sensors */}
      <Card title="Sensors" right={<span className="text-xs opacity-70">Tap a numeric sensor to open chart</span>}>
        {sensorCards.length === 0 ? (
          <div className="text-sm opacity-70">No sensor values found in latest telemetry.</div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {sensorCards.map(([k, v]) => {
              const hasChart = Boolean(series?.[k]?.length);
              return (
                <button
                  key={k}
                  onClick={() => hasChart && setOpenSensor(k)}
                  className={
                    "text-left rounded-2xl bg-black/20 ring-1 ring-white/10 p-4 transition " +
                    (hasChart ? "hover:bg-black/30" : "opacity-80 cursor-default")
                  }
                  title={hasChart ? "Open chart" : "No numeric history to chart"}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <SensorIcon k={k} className="h-5 w-5" />
                      <div className="text-xs opacity-70">{labelize(k)}</div>
                    </div>
                    <div className={"text-xs " + (hasChart ? "opacity-70" : "opacity-50")}>
                      {hasChart ? "Chart" : "—"}
                    </div>
                  </div>

                  <div className="mt-2 text-2xl font-semibold">{String(v)}</div>
                  <div className="mt-2 text-xs opacity-60">
                    {hasChart ? `History: ${series[k].length}` : "Graph: not numeric"}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </Card>

      <SensorChartModal
        open={Boolean(openSensor)}
        sensorKey={openSensor || ""}
        points={openSensor ? series?.[openSensor] : []}
        onClose={() => setOpenSensor(null)}
      />

      {/* Actuators */}
      <Card title="Actuators">
        {Object.keys(actuators).length === 0 ? (
          <div className="text-sm opacity-70">
            No actuators found in <code className="opacity-90">control.actuators</code> or{" "}
            <code className="opacity-90">config.actuators</code>.
          </div>
        ) : (
          <div className="grid gap-3 md:grid-cols-2">
            {Object.entries(actuators).map(([name, a]) => {
              const busy = Boolean(savingAct[name]);
              const on = a.state === "ON";

              return (
                <div key={name} className="rounded-2xl bg-black/20 ring-1 ring-white/10 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <ActuatorIcon k={name} className="h-5 w-5" />
                      <div>
                        <div className="text-sm font-semibold">{labelize(name)}</div>
                        <div className="mt-0.5 text-xs opacity-70">
                          State: <span className="opacity-100">{a.state}</span> • Auto:{" "}
                          <span className="opacity-100">{a.auto ? "ON" : "OFF"}</span>
                          {busy ? <span className="ml-2 opacity-70">Saving…</span> : null}
                        </div>
                      </div>
                    </div>

                    <span
                      className={
                        "rounded-full px-2 py-1 text-xs ring-1 " +
                        (on
                          ? "bg-emerald-500/15 text-emerald-200 ring-emerald-400/30"
                          : "bg-white/10 text-white/80 ring-white/10")
                      }
                    >
                      {on ? "ON" : "OFF"}
                    </span>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      onClick={() => toggleActState(name)}
                      disabled={busy}
                      className={
                        "rounded-xl px-4 py-2 text-sm ring-1 " +
                        (on
                          ? "bg-rose-500/15 hover:bg-rose-500/20 ring-rose-400/30"
                          : "bg-emerald-500/15 hover:bg-emerald-500/20 ring-emerald-400/30")
                      }
                    >
                      {on ? "Turn OFF" : "Turn ON"}
                    </button>

                    <button
                      onClick={() => toggleActAuto(name)}
                      disabled={busy}
                      className="rounded-xl bg-white/10 hover:bg-white/15 ring-1 ring-white/10 px-4 py-2 text-sm"
                    >
                      {a.auto ? "Disable Auto" : "Enable Auto"}
                    </button>


                    <button
  onClick={() => router.push(`/devices/${deviceId}/actuators/${name}/schedule`)}
  className="rounded-xl bg-white/10 hover:bg-white/15 ring-1 ring-white/10 px-3 py-2 text-sm"
>
  Schedule
</button>
    
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
    </div>
  );
}
