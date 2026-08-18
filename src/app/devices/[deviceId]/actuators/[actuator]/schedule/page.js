"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { apiGet, apiPost, apiPut, apiDelete } from "../../../../../lib/api";
import AquariumBackground from "../../../../../components/AquariumBackground";
import AquariumLoader from "../../../../../components/AquariumLoader";

import {
  Calendar,
  Clock,
  ArrowLeft,
  Plus,
  Trash2,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Sparkles,
  Repeat,
  Timer,
  AlertTriangle,
} from "lucide-react";

function safeMsg(e) {
  const msg =
    e?.message ||
    e?.error ||
    e?.response?.data?.message ||
    (typeof e === "string" ? e : "") ||
    "Unknown error";
  return String(msg).slice(0, 300);
}

function getId(v) {
  if (!v) return "";
  if (typeof v === "string") return v;
  if (typeof v === "object") {
    if (typeof v.$oid === "string") return v.$oid;
    if (typeof v._id === "string") return v._id;
    if (typeof v.id === "string") return v.id;
    if (typeof v.toString === "function") return v.toString();
  }
  return String(v);
}

function pad2(n) {
  const x = Number(n) || 0;
  return x < 10 ? `0${x}` : `${x}`;
}

const DOW = [
  { key: 0, label: "Sun" },
  { key: 1, label: "Mon" },
  { key: 2, label: "Tue" },
  { key: 3, label: "Wed" },
  { key: 4, label: "Thu" },
  { key: 5, label: "Fri" },
  { key: 6, label: "Sat" },
];

function buildScheduleCron({ scheduleType, hour, minute, intervalVal, days }) {
  const selected = (Array.isArray(days) ? days : [])
    .filter((d) => Number.isFinite(d))
    .map((d) => Number(d))
    .filter((d) => d >= 0 && d <= 6);
  const dow = selected.length ? selected.join(",") : "*";

  if (scheduleType === "minutes") {
    const mInterval = Math.max(1, Math.min(59, Number(intervalVal) || 15));
    return `*/${mInterval} * * * *`;
  }

  if (scheduleType === "hours") {
    const hInterval = Math.max(1, Math.min(23, Number(intervalVal) || 2));
    const m = Math.max(0, Math.min(59, Number(minute) || 0));
    return `${m} */${hInterval} * * ${dow}`;
  }

  // default: specific time
  const h = Math.max(0, Math.min(23, Number(hour) || 0));
  const m = Math.max(0, Math.min(59, Number(minute) || 0));
  return `${m} ${h} * * ${dow}`;
}

function prettyCronSummary(cronStr) {
  const parts = String(cronStr || "").trim().split(/\s+/);
  if (parts.length < 5) return cronStr || "—";

  const [minPart, hourPart, , , dowPart] = parts;

  // Case 1: Every X minutes (*/15 * * * *)
  if (minPart.startsWith("*/")) {
    const m = minPart.replace("*/", "");
    return `Every ${m} minute(s)`;
  }

  // Case 2: Every X hours (0 */4 * * *)
  if (hourPart.startsWith("*/")) {
    const h = hourPart.replace("*/", "");
    const atMin = pad2(minPart);
    const dowStr = prettyDaysString(dowPart);
    return `Every ${h} hour(s) at :${atMin} (${dowStr})`;
  }

  // Case 3: Specific time (0 8 * * *)
  const timeStr = `${pad2(hourPart)}:${pad2(minPart)}`;
  const dowStr = prettyDaysString(dowPart);
  return `${dowStr} at ${timeStr}`;
}

function prettyDaysString(dow) {
  if (!dow || dow === "*") return "Every day";

  const nums = dow
    .split(",")
    .map((x) => Number(x))
    .filter((x) => Number.isFinite(x) && x >= 0 && x <= 6);

  if (!nums.length) return "Every day";
  if (nums.length === 7) return "Every day";
  if (nums.length === 5 && !nums.includes(0) && !nums.includes(6)) return "Weekdays";
  if (nums.length === 2 && nums.includes(0) && nums.includes(6)) return "Weekends";

  return nums.map((n) => DOW.find((d) => d.key === n)?.label || `${n}`).join(", ");
}

function prettyDuration(durationSec) {
  const sec = Math.max(0, Number(durationSec) || 0);
  if (sec === 0) return "Instant trigger";
  if (sec < 60) return `${sec}s`;
  const m = Math.floor(sec / 60);
  const remSec = sec % 60;
  if (remSec === 0) return `${m}m`;
  return `${m}m ${remSec}s`;
}

export default function ActuatorSchedulePage() {
  const params = useParams();
  const router = useRouter();

  const deviceId = params?.deviceId;
  const actuator = params?.actuator;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState("");

  const [error, setError] = useState("");
  const [schedules, setSchedules] = useState([]);

  // Form State
  const [name, setName] = useState("");
  const [enabled, setEnabled] = useState(true);
  const [scheduleType, setScheduleType] = useState("daily"); // "daily" | "hours" | "minutes"

  const [timezone, setTimezone] = useState(
    Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Colombo"
  );

  // Time & Intervals
  const [hour, setHour] = useState("8");
  const [minute, setMinute] = useState("0");
  const [intervalVal, setIntervalVal] = useState("4"); // e.g. every 4 hours or every 15 min

  // Duration in Minutes & Seconds
  const [durationMin, setDurationMin] = useState("0");
  const [durationSec, setDurationSec] = useState("10"); // default 10s (great for feeders/dosers)

  const [days, setDays] = useState([]);

  // Calculate live preview
  const preview = useMemo(() => {
    const cron = buildScheduleCron({ scheduleType, hour, minute, intervalVal, days });
    const dm = Math.max(0, Number(durationMin) || 0);
    const ds = Math.max(0, Number(durationSec) || 0);
    const totalSec = Math.max(1, dm * 60 + ds);
    return { cron, duration_sec: totalSec };
  }, [scheduleType, hour, minute, intervalVal, days, durationMin, durationSec]);

  const load = useCallback(async () => {
    if (!deviceId) return;

    setError("");
    setLoading(true);
    try {
      const data = await apiGet(`/api/schedules/devices/${deviceId}/schedules`);
      const list = Array.isArray(data?.schedules) ? data.schedules : [];

      const filtered = list.filter((s) => {
        const a1 = Array.isArray(s.actions) ? s.actions : [];
        const a2 = Array.isArray(s.end_actions) ? s.end_actions : [];
        return (
          a1.some((x) => x?.actuator === actuator) ||
          a2.some((x) => x?.actuator === actuator)
        );
      });

      filtered.sort((a, b) => {
        const ta = new Date(a?.updatedAt || a?.createdAt || 0).getTime();
        const tb = new Date(b?.updatedAt || b?.createdAt || 0).getTime();
        return tb - ta;
      });

      setSchedules(filtered);
    } catch (e) {
      setError(safeMsg(e));
      setSchedules([]);
    } finally {
      setLoading(false);
    }
  }, [deviceId, actuator]);

  useEffect(() => {
    load();
  }, [load]);

  const toggleDay = (k) => {
    setDays((prev) => {
      const set = new Set(Array.isArray(prev) ? prev : []);
      if (set.has(k)) set.delete(k);
      else set.add(k);
      return Array.from(set).sort((a, b) => a - b);
    });
  };

  const saveNew = async () => {
    if (!deviceId || !actuator) return;

    setError("");
    setSaving(true);
    try {
      const autoName =
        scheduleType === "minutes"
          ? `${actuator} every ${intervalVal}m`
          : scheduleType === "hours"
          ? `${actuator} every ${intervalVal}h`
          : `${actuator} at ${pad2(hour)}:${pad2(minute)}`;

      const nm = (name || "").trim() || autoName;

      const body = {
        name: nm,
        enabled,
        timezone,
        cron: preview.cron,
        duration_sec: preview.duration_sec,
        actions: [{ actuator, set: { state: "ON", auto: true } }],
        end_actions: [{ actuator, set: { state: "OFF", auto: true } }],
      };

      await apiPost(`/api/schedules/devices/${deviceId}/schedules`, body);

      setName("");
      await load();
    } catch (e) {
      setError(safeMsg(e));
    } finally {
      setSaving(false);
    }
  };

  const toggleEnabled = async (s) => {
    const id = getId(s?._id || s?.id);
    if (!id) return;

    setError("");
    setBusyId(id);
    try {
      await apiPut(`/api/schedules/${id}`, { enabled: !s.enabled });
      await load();
    } catch (e) {
      setError(safeMsg(e));
    } finally {
      setBusyId("");
    }
  };

  const deleteSchedule = async (s) => {
    const id = getId(s?._id || s?.id);
    if (!id) {
      setError("Schedule id is missing.");
      return;
    }

    const ok = window.confirm("Are you sure you want to delete this schedule?");
    if (!ok) return;

    setError("");
    setBusyId(id);
    try {
      await apiDelete(`/api/schedules/${id}`);
      await load();
    } catch (e) {
      setError(safeMsg(e));
    } finally {
      setBusyId("");
    }
  };

  return (
    <div className="relative min-h-screen px-4 sm:px-8 pb-16 max-w-5xl mx-auto space-y-6">
      {/* 🌊 Subtle Marine Background */}
      <AquariumBackground showSeabed={true} density="sparse" subtle={true} />

      {/* 🌟 Top Header */}
      <div className="relative z-10 glass-panel p-6 sm:p-7 bg-[#05172a]/92 border-white/15 shadow-2xl backdrop-blur-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <Link
              href={`/devices/${deviceId}`}
              className="inline-flex items-center gap-2 text-xs font-semibold text-cyan-300 hover:text-white transition group mb-1.5"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
              <span>Back to Tank</span>
            </Link>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 flex items-center justify-center">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white tracking-tight capitalize">
                  {actuator} Automation
                </h1>
                <p className="text-xs text-cyan-200/60 font-mono mt-0.5">
                  Device: {deviceId}
                </p>
              </div>
            </div>
          </div>
        </div>

        {error && (
          <div className="mt-4 p-3.5 rounded-2xl bg-rose-500/20 text-rose-200 text-sm border border-rose-500/30 flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* ⏰ SECTION 1: Create Schedule / Repeating Routine */}
      <div className="relative z-10 glass-panel p-6 sm:p-8 bg-[#05172a]/92 border-white/15 shadow-xl backdrop-blur-2xl space-y-6">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-cyan-400" />
            <h2 className="text-lg font-bold text-white">Create Schedule Routine</h2>
          </div>
          <span className="text-xs font-mono text-cyan-300/80 bg-cyan-500/10 px-2.5 py-1 rounded-lg border border-cyan-400/20">
            {preview.cron}
          </span>
        </div>

        {/* 🔄 Schedule Type Selector Tabs (Daily, Repeating Hours, Repeating Minutes) */}
        <div>
          <label className="block text-xs font-semibold text-cyan-100/90 uppercase tracking-wider mb-2">
            Frequency Pattern
          </label>
          <div className="grid grid-cols-3 gap-2.5">
            <button
              type="button"
              onClick={() => {
                setScheduleType("daily");
              }}
              className={`py-3 px-3 rounded-2xl text-xs font-bold transition flex items-center justify-center gap-2 border cursor-pointer ${
                scheduleType === "daily"
                  ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white border-cyan-300 shadow-md shadow-cyan-500/30"
                  : "bg-white/5 text-slate-300 border-white/10 hover:bg-white/10"
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>Specific Time</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setScheduleType("hours");
                setIntervalVal("4");
              }}
              className={`py-3 px-3 rounded-2xl text-xs font-bold transition flex items-center justify-center gap-2 border cursor-pointer ${
                scheduleType === "hours"
                  ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white border-cyan-300 shadow-md shadow-cyan-500/30"
                  : "bg-white/5 text-slate-300 border-white/10 hover:bg-white/10"
              }`}
            >
              <Repeat className="w-4 h-4" />
              <span>Every X Hours</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setScheduleType("minutes");
                setIntervalVal("15");
              }}
              className={`py-3 px-3 rounded-2xl text-xs font-bold transition flex items-center justify-center gap-2 border cursor-pointer ${
                scheduleType === "minutes"
                  ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white border-cyan-300 shadow-md shadow-cyan-500/30"
                  : "bg-white/5 text-slate-300 border-white/10 hover:bg-white/10"
              }`}
            >
              <Timer className="w-4 h-4" />
              <span>Every X Minutes</span>
            </button>
          </div>
        </div>

        {/* Dynamic Pattern Fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Routine Name */}
          <div>
            <label className="block text-xs font-semibold text-cyan-100/90 uppercase tracking-wider mb-1.5">
              Routine Name (Optional)
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={`e.g., ${actuator} schedule`}
              className="aquatic-input"
            />
          </div>

          {/* Timezone */}
          <div>
            <label className="block text-xs font-semibold text-cyan-100/90 uppercase tracking-wider mb-1.5">
              Timezone
            </label>
            <input
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="aquatic-input font-mono text-sm"
            />
          </div>

          {/* Case 1: Specific Daily Time */}
          {scheduleType === "daily" && (
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-cyan-100/90 uppercase tracking-wider mb-1.5">
                Trigger Time (24h)
              </label>
              <div className="flex items-center gap-2">
                <input
                  value={hour}
                  onChange={(e) => setHour(e.target.value)}
                  inputMode="numeric"
                  className="aquatic-input text-center text-lg font-bold w-24"
                  placeholder="08"
                  maxLength={2}
                />
                <span className="text-2xl font-bold text-cyan-300">:</span>
                <input
                  value={minute}
                  onChange={(e) => setMinute(e.target.value)}
                  inputMode="numeric"
                  className="aquatic-input text-center text-lg font-bold w-24"
                  placeholder="00"
                  maxLength={2}
                />
                <span className="text-xs text-cyan-200/60 ml-2">
                  ({pad2(hour)}:{pad2(minute)})
                </span>
              </div>
            </div>
          )}

          {/* Case 2: Every X Hours */}
          {scheduleType === "hours" && (
            <div>
              <label className="block text-xs font-semibold text-cyan-100/90 uppercase tracking-wider mb-1.5">
                Repeat Every (Hours)
              </label>
              <div className="flex items-center gap-2">
                <select
                  value={intervalVal}
                  onChange={(e) => setIntervalVal(e.target.value)}
                  className="aquatic-input text-base font-semibold"
                >
                  <option value="1">Every 1 Hour</option>
                  <option value="2">Every 2 Hours</option>
                  <option value="3">Every 3 Hours</option>
                  <option value="4">Every 4 Hours</option>
                  <option value="6">Every 6 Hours</option>
                  <option value="8">Every 8 Hours</option>
                  <option value="12">Every 12 Hours</option>
                </select>
              </div>
            </div>
          )}

          {/* Case 3: Every X Minutes */}
          {scheduleType === "minutes" && (
            <div>
              <label className="block text-xs font-semibold text-cyan-100/90 uppercase tracking-wider mb-1.5">
                Repeat Every (Minutes)
              </label>
              <div className="flex items-center gap-2">
                <select
                  value={intervalVal}
                  onChange={(e) => setIntervalVal(e.target.value)}
                  className="aquatic-input text-base font-semibold"
                >
                  <option value="1">Every 1 Minute</option>
                  <option value="2">Every 2 Minutes</option>
                  <option value="5">Every 5 Minutes</option>
                  <option value="10">Every 10 Minutes</option>
                  <option value="15">Every 15 Minutes</option>
                  <option value="20">Every 20 Minutes</option>
                  <option value="30">Every 30 Minutes</option>
                  <option value="45">Every 45 Minutes</option>
                </select>
              </div>
            </div>
          )}

          {/* Active Duration in Minutes and Seconds */}
          <div className={scheduleType === "daily" ? "sm:col-span-2" : ""}>
            <label className="block text-xs font-semibold text-cyan-100/90 uppercase tracking-wider mb-1.5">
              Active Run Duration
            </label>
            <div className="flex items-center gap-2.5">
              <div className="flex-1">
                <div className="relative">
                  <input
                    value={durationMin}
                    onChange={(e) => setDurationMin(e.target.value)}
                    inputMode="numeric"
                    className="aquatic-input pr-12 text-base font-bold"
                    placeholder="0"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-cyan-200/60">
                    min
                  </span>
                </div>
              </div>

              <span className="text-slate-400 font-bold">+</span>

              <div className="flex-1">
                <div className="relative">
                  <input
                    value={durationSec}
                    onChange={(e) => setDurationSec(e.target.value)}
                    inputMode="numeric"
                    className="aquatic-input pr-12 text-base font-bold"
                    placeholder="10"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-cyan-200/60">
                    sec
                  </span>
                </div>
              </div>
            </div>
            <p className="text-[11px] text-cyan-200/50 mt-1">
              Turns ON, then automatically turns OFF after {prettyDuration(preview.duration_sec)}.
            </p>
          </div>
        </div>

        {/* Weekday Selector (Applicable for Daily & Hourly modes) */}
        {scheduleType !== "minutes" && (
          <div>
            <label className="block text-xs font-semibold text-cyan-100/90 uppercase tracking-wider mb-2">
              Active Days
            </label>
            <div className="flex flex-wrap gap-2">
              {DOW.map((d) => {
                const on = days.includes(d.key);
                return (
                  <button
                    key={d.key}
                    type="button"
                    onClick={() => toggleDay(d.key)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                      on
                        ? "bg-gradient-to-r from-cyan-500 to-blue-600 text-white border-cyan-300 shadow-md shadow-cyan-500/30"
                        : "bg-white/5 text-slate-300 border-white/10 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    {d.label}
                  </button>
                );
              })}
              <button
                type="button"
                onClick={() => setDays([])}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                  days.length === 0
                    ? "bg-teal-500/20 text-teal-300 border-teal-400/40"
                    : "bg-white/5 text-slate-300 border-white/10 hover:bg-white/10"
                }`}
              >
                Every Day
              </button>
            </div>
          </div>
        )}

        {/* Summary & Create Button */}
        <div className="pt-4 border-t border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="text-xs text-cyan-100/85">
            <span className="font-semibold text-cyan-300">Summary:</span>{" "}
            {prettyCronSummary(preview.cron)} • Run for{" "}
            <span className="font-bold text-white">{prettyDuration(preview.duration_sec)}</span>
          </div>

          <button
            onClick={saveNew}
            disabled={saving}
            className="btn-aquatic py-2.5 px-5 text-xs font-bold shadow-lg shadow-cyan-500/30 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>{saving ? "Saving..." : "Add Schedule"}</span>
          </button>
        </div>
      </div>

      {/* 📋 SECTION 2: Active Schedules */}
      <div className="relative z-10 glass-panel p-6 sm:p-8 bg-[#05172a]/92 border-white/15 shadow-xl backdrop-blur-2xl space-y-3.5">
        <div className="flex items-center justify-between border-b border-white/10 pb-3.5">
          <div className="flex items-center gap-2">
            <Clock className="w-5 h-5 text-emerald-400" />
            <h2 className="text-lg font-bold text-white">Active Schedules</h2>
          </div>
          <button
            onClick={load}
            disabled={loading}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-cyan-300 transition cursor-pointer"
            title="Refresh schedules"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>

        {loading ? (
          <div className="py-8">
            <AquariumLoader
              title="Loading Automation Routines"
              subtitle="Fetching active actuator triggers and timers..."
              fullScreen={false}
            />
          </div>
        ) : schedules.length === 0 ? (
          <div className="py-10 text-center text-cyan-100/60 max-w-sm mx-auto">
            <Calendar className="w-10 h-10 text-cyan-500/40 mx-auto mb-2" />
            <p className="text-sm font-semibold text-white">No Schedules Yet</p>
            <p className="text-xs text-cyan-200/60 mt-0.5">
              Add a daily or repeating schedule above for this {actuator}.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {schedules.map((s) => {
              const id = getId(s?._id || s?.id);
              const isBusy = busyId === id;
              const isEnabled = Boolean(s?.enabled);

              return (
                <div
                  key={id || Math.random()}
                  className={`glass-panel p-4 border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-2xl ${
                    isEnabled
                      ? "bg-[#061e36]/90 border-emerald-500/30"
                      : "bg-white/5 border-white/10 opacity-75"
                  }`}
                >
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-white">
                        {s?.name || "Automated Schedule"}
                      </h3>
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                          isEnabled
                            ? "bg-emerald-500/20 text-emerald-300 border-emerald-400/30"
                            : "bg-white/10 text-slate-400 border-white/10"
                        }`}
                      >
                        {isEnabled ? <CheckCircle2 className="w-2.5 h-2.5" /> : <XCircle className="w-2.5 h-2.5" />}
                        <span>{isEnabled ? "Active" : "Disabled"}</span>
                      </span>
                    </div>

                    <p className="text-xs text-cyan-100/80">
                      {prettyCronSummary(s?.cron)} •{" "}
                      <span className="font-semibold text-white">
                        Duration: {prettyDuration(s?.duration_sec)}
                      </span>
                    </p>

                    <p className="text-[10px] text-cyan-200/40 font-mono">
                      Cron: {s?.cron} • TZ: {s?.timezone || "UTC"}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                    <button
                      onClick={() => toggleEnabled(s)}
                      disabled={isBusy || !id}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                        isEnabled
                          ? "bg-white/10 text-slate-300 border-white/15 hover:bg-white/20 hover:text-white"
                          : "bg-emerald-500/20 text-emerald-300 border-emerald-400/40 hover:bg-emerald-500/30"
                      }`}
                    >
                      {isEnabled ? "Disable" : "Enable"}
                    </button>

                    <button
                      onClick={() => deleteSchedule(s)}
                      disabled={isBusy || !id}
                      className="p-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20 transition cursor-pointer"
                      title="Delete Schedule"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
