"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { apiGet } from "../lib/api";
import AquariumBackground from "../components/AquariumBackground";
import AquariumLoader from "../components/AquariumLoader";
import {
  Fish,
  Thermometer,
  Droplets,
  Activity,
  Waves,
  RefreshCw,
  ArrowUpRight,
  ShieldCheck,
  Radio,
  PlusCircle,
  AlertTriangle,
} from "lucide-react";

export default function HomePage() {
  const router = useRouter();
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  async function loadDevices(isRefresh = false) {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError("");

    try {
      const res = await apiGet("/api/devices");
      const list = res?.devices || [];
      setDevices(list);
    } catch (err) {
      setError(err.message || "Unable to retrieve your aquarium devices.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    loadDevices();
  }, []);

  // Compute fleet statistics using real telemetry data
  const stats = useMemo(() => {
    const total = devices.length;
    const online = devices.filter((d) => Boolean(d?.last_telemetry)).length;
    const offline = total - online;

    const temps = devices
      .map((d) => d?.last_telemetry?.t)
      .filter((t) => typeof t === "number" && !Number.isNaN(t));
    const avgTemp =
      temps.length > 0
        ? (temps.reduce((a, b) => a + b, 0) / temps.length).toFixed(1)
        : "—";

    return { total, online, offline, avgTemp };
  }, [devices]);

  return (
    <div className="relative min-h-[calc(100vh-80px)] px-4 sm:px-8 pb-16 max-w-7xl mx-auto">
      {/* 🌊 Subtle Living Aquatic Background */}
      <AquariumBackground showSeabed={true} density="sparse" subtle={true} />

      {/* 🌟 Top Hero Banner */}
      <div className="relative z-10 pt-4 mb-8">
        <div className="glass-panel p-6 sm:p-8 bg-[#05172a]/92 border-white/15 shadow-2xl backdrop-blur-2xl relative overflow-hidden">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative z-10">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-400/15 border border-cyan-400/30 text-cyan-300 text-xs font-semibold mb-3">
                <Radio className="w-3.5 h-3.5 animate-pulse text-emerald-400" />
                <span>Live Fleet Status</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                Aquatic Sanctuary 🐠
              </h1>
              <p className="text-sm sm:text-base text-cyan-100/70 mt-1 max-w-xl">
                Real-time biological monitoring, environmental metrics, and intelligent automated tank controls.
              </p>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => loadDevices(true)}
                disabled={loading || refreshing}
                className="btn-aquatic py-2.5 px-4 text-xs font-semibold"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin" : ""}`} />
                <span>Refresh Fleet</span>
              </button>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-8 pt-6 border-t border-white/10">
            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10">
              <span className="text-xs text-cyan-200/70 block">Total Tanks</span>
              <span className="text-2xl font-bold text-white mt-0.5 block">{stats.total}</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
              <span className="text-xs text-emerald-300/80 block">Online</span>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-2xl font-bold text-emerald-200">{stats.online}</span>
              </div>
            </div>
            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10">
              <span className="text-xs text-cyan-200/70 block">Offline</span>
              <span className="text-2xl font-bold text-slate-300 mt-0.5 block">{stats.offline}</span>
            </div>
            <div className="p-3.5 rounded-2xl bg-white/5 border border-white/10">
              <span className="text-xs text-cyan-200/70 block">Fleet Avg Temp</span>
              <span className="text-2xl font-bold text-cyan-300 mt-0.5 block">
                {stats.avgTemp !== "—" ? `${stats.avgTemp} °C` : "—"}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Error alert */}
      {error && (
        <div className="relative z-10 mb-6 p-4 rounded-2xl bg-rose-500/20 text-rose-200 text-sm border border-rose-500/30 backdrop-blur-xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={() => loadDevices(true)}
            className="text-xs font-semibold underline hover:text-white"
          >
            Retry
          </button>
        </div>
      )}

      {/* 🐠 Tank Cards Grid */}
      <div className="relative z-10">
        {loading ? (
          <div className="py-12">
            <AquariumLoader
              title="Synchronizing Tank Fleet"
              subtitle="Fetching live sensor status for all connected aquariums..."
              fullScreen={false}
            />
          </div>
        ) : devices.length === 0 ? (
          <div className="glass-panel p-12 text-center max-w-lg mx-auto bg-[#05172a]/92 border-white/15">
            <div className="w-16 h-16 rounded-3xl bg-cyan-500/20 text-cyan-300 flex items-center justify-center mx-auto mb-4">
              <Waves className="w-8 h-8" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">No Aquarium Devices Found</h3>
            <p className="text-sm text-cyan-100/70 mb-6">
              Connect your first IoT aquarium controller to start monitoring real-time water conditions.
            </p>
            <button
              onClick={() => loadDevices(true)}
              className="btn-aquatic py-2.5 px-5 text-sm"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Scan Again</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {devices.map((d) => {
              const name =
                d?.config?.device?.name || d?.name || d?.deviceName || `Tank ${d.deviceId}`;
              const model = d?.config?.device?.model || d?.model || null;
              const isOnline = Boolean(d?.last_telemetry);

              const temp = d?.last_telemetry?.t ?? null;
              const hum = d?.last_telemetry?.h ?? null;
              const ph = d?.last_telemetry?.ph ?? null;

              return (
                <div
                  key={d.deviceId}
                  className="glass-panel glass-panel-hover p-6 flex flex-col justify-between bg-[#05172a]/92 border-white/15 backdrop-blur-2xl group relative overflow-hidden"
                >
                  <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-cyan-400 via-teal-300 to-blue-500 opacity-60 group-hover:opacity-100 transition-opacity" />

                  {/* Header Row */}
                  <div className="flex items-start justify-between gap-3 mb-5">
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="text-xl font-bold text-white group-hover:text-cyan-300 transition-colors">
                          {name}
                        </h2>
                      </div>
                      <p className="text-xs text-cyan-200/60 mt-0.5 font-mono">
                        ID: {d.deviceId} {model ? `• ${model}` : ""}
                      </p>
                    </div>

                    {/* Online / Offline Badge */}
                    <div
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${
                        isOnline
                          ? "bg-emerald-500/20 text-emerald-300 border-emerald-400/40 shadow-sm shadow-emerald-500/20"
                          : "bg-rose-500/20 text-rose-300 border-rose-400/40"
                      }`}
                    >
                      <span
                        className={`w-2 h-2 rounded-full ${
                          isOnline ? "bg-emerald-400 animate-pulse" : "bg-rose-400"
                        }`}
                      />
                      <span>{isOnline ? "Online" : "Offline"}</span>
                    </div>
                  </div>

                  {/* Telemetry Metric Pills */}
                  <div className="grid grid-cols-3 gap-2.5 my-4">
                    {/* Temperature */}
                    <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-center group-hover:border-cyan-400/30 transition">
                      <div className="flex items-center justify-center text-amber-400 mb-1">
                        <Thermometer className="w-4 h-4" />
                      </div>
                      <span className="text-[10px] uppercase font-semibold text-slate-400 block">
                        Water Temp
                      </span>
                      <span className="text-base font-bold text-white mt-0.5 block">
                        {temp !== null ? `${temp}°` : "—"}
                      </span>
                    </div>

                    {/* pH Level */}
                    <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-center group-hover:border-cyan-400/30 transition">
                      <div className="flex items-center justify-center text-cyan-400 mb-1">
                        <Activity className="w-4 h-4" />
                      </div>
                      <span className="text-[10px] uppercase font-semibold text-slate-400 block">
                        pH Level
                      </span>
                      <span className="text-base font-bold text-white mt-0.5 block">
                        {ph !== null ? ph : "—"}
                      </span>
                    </div>

                    {/* Humidity */}
                    <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-center group-hover:border-cyan-400/30 transition">
                      <div className="flex items-center justify-center text-teal-400 mb-1">
                        <Droplets className="w-4 h-4" />
                      </div>
                      <span className="text-[10px] uppercase font-semibold text-slate-400 block">
                        Humidity
                      </span>
                      <span className="text-base font-bold text-white mt-0.5 block">
                        {hum !== null ? `${hum}%` : "—"}
                      </span>
                    </div>
                  </div>

                  {/* Open Tank Action */}
                  <button
                    onClick={() => router.push(`/devices/${d.deviceId}`)}
                    className="w-full mt-2 py-3 px-4 rounded-2xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-400/30 hover:border-cyan-400/60 text-cyan-200 hover:text-white font-semibold text-sm transition flex items-center justify-center gap-2 group/btn cursor-pointer shadow-lg shadow-cyan-950/40"
                  >
                    <span>Manage Aquarium</span>
                    <ArrowUpRight className="w-4 h-4 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
