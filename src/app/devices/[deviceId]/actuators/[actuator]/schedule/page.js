"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";

// ✅ Correct path for YOUR project (api helper is at: src/app/lib/api.js)
import { apiGet, apiPost, apiPut, apiDelete } from "../../../../../lib/api";

/**
 * FULL Schedule Page (clean + fixed delete)
 * Path:
 *   aquarium-frontend/src/app/devices/[deviceId]/actuators/[actuator]/schedule/page.js
 *
 * Uses backend endpoints (through your api helpers):
 *   GET    /api/schedules/devices/:deviceId/schedules
 *   POST   /api/schedules/devices/:deviceId/schedules
 *   PUT    /api/schedules/:scheduleId
 *   DELETE /api/schedules/:scheduleId
 */

// ---------- utils ----------
function safeMsg(e) {
  const msg =
    e?.message ||
    e?.error ||
    e?.response?.data?.message ||
    (typeof e === "string" ? e : "") ||
    "Unknown error";
  return String(msg).slice(0, 300);
}

// ✅ VERY IMPORTANT: handle Mongo ObjectId coming as object or string
function getId(v) {
  if (!v) return "";
  if (typeof v === "string") return v;
  if (typeof v === "object") {
    // common formats:
    if (typeof v.$oid === "string") return v.$oid;
    if (typeof v._id === "string") return v._id;
    if (typeof v.id === "string") return v.id;
    // last fallback
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

// cron: "minute hour * * dow"
function buildCron({ hour, minute, days }) {
  const h = Math.max(0, Math.min(23, Number(hour) || 0));
  const m = Math.max(0, Math.min(59, Number(minute) || 0));
  const selected = (Array.isArray(days) ? days : [])
    .filter((d) => Number.isFinite(d))
    .map((d) => Number(d))
    .filter((d) => d >= 0 && d <= 6);

  const dow = selected.length ? selected.join(",") : "*"; // empty => every day
  return `${m} ${h} * * ${dow}`;
}

function prettyDays(cronStr) {
  const parts = String(cronStr || "").trim().split(/\s+/);
  const dow = parts?.[4];
  if (!dow || dow === "*") return "Every day";

  const nums = dow
    .split(",")
    .map((x) => Number(x))
    .filter((x) => Number.isFinite(x) && x >= 0 && x <= 6);

  if (!nums.length) return "Custom";
  return nums.map((n) => DOW.find((d) => d.key === n)?.label || `${n}`).join(", ");
}

function prettyTime(cronStr) {
  const parts = String(cronStr || "").trim().split(/\s+/);
  const m = Number(parts?.[0]);
  const h = Number(parts?.[1]);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return "—";
  return `${pad2(h)}:${pad2(m)}`;
}

// ---------- component ----------
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

  // Form state
  const [name, setName] = useState("");
  const [enabled, setEnabled] = useState(true);

  const [timezone, setTimezone] = useState(
    Intl.DateTimeFormat().resolvedOptions().timeZone || "Asia/Colombo"
  );

  // Time + duration
  const [hour, setHour] = useState("8");
  const [minute, setMinute] = useState("0");
  const [durationMin, setDurationMin] = useState("10");

  // Days selection (default: everyday)
  const [days, setDays] = useState([]); // empty => every day

  const preview = useMemo(() => {
    const cron = buildCron({ hour, minute, days });
    const dm = Math.max(1, Math.min(24 * 60, Number(durationMin) || 0)); // 1..1440
    return { cron, duration_sec: dm * 60 };
  }, [hour, minute, durationMin, days]);

  const load = useCallback(async () => {
    if (!deviceId) return;

    setError("");
    setLoading(true);
    try {
      const data = await apiGet(`/api/schedules/devices/${deviceId}/schedules`);
      const list = Array.isArray(data?.schedules) ? data.schedules : [];

      // Keep schedules that mention THIS actuator in actions or end_actions
      const filtered = list.filter((s) => {
        const a1 = Array.isArray(s.actions) ? s.actions : [];
        const a2 = Array.isArray(s.end_actions) ? s.end_actions : [];
        return (
          a1.some((x) => x?.actuator === actuator) ||
          a2.some((x) => x?.actuator === actuator)
        );
      });

      // Sort recent first (if timestamps exist)
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
      const nm = (name || "").trim() || `${actuator} schedule`;

      const body = {
        name: nm,
        enabled,
        timezone,
        cron: preview.cron,
        duration_sec: preview.duration_sec,

        // You can change these actuator commands if your backend expects different shape
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
      setError("Schedule id is missing/invalid.");
      return;
    }

    const ok = window.confirm("Delete this schedule?");
    if (!ok) return;

    setError("");
    setBusyId(id);
    try {
      // ✅ This matches your backend: DELETE /api/schedules/:scheduleId
      await apiDelete(`/api/schedules/${id}`);
      await load();
    } catch (e) {
      setError(safeMsg(e));
    } finally {
      setBusyId("");
    }
  };

  const goBack = () => {
    router.push(`/devices/${deviceId}`);
  };

  return (
    <div className="p-4 md:p-6 max-w-5xl mx-auto">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-semibold">
            Schedule • {actuator}
          </h1>
          <p className="text-sm text-gray-500">
            Device: <span className="font-mono">{deviceId}</span>
          </p>
        </div>

        <button
          onClick={goBack}
          className="px-3 py-2 rounded-lg border hover:bg-gray-50"
        >
          ← Back
        </button>
      </div>

      {error ? (
        <div className="mt-4 p-3 rounded-lg border border-red-200 bg-red-50 text-red-700">
          {error}
        </div>
      ) : null}

      {/* Create new schedule */}
      <div className="mt-6 rounded-2xl border p-4 md:p-5">
        <h2 className="text-lg font-semibold">Create schedule</h2>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="block">
            <div className="text-sm font-medium mb-1">Name</div>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={`${actuator} schedule`}
              className="w-full rounded-lg border px-3 py-2"
            />
          </label>

          <label className="block">
            <div className="text-sm font-medium mb-1">Timezone</div>
            <input
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="w-full rounded-lg border px-3 py-2"
            />
          </label>

          <label className="block">
            <div className="text-sm font-medium mb-1">Start time (24h)</div>
            <div className="flex items-center gap-2">
              <input
                value={hour}
                onChange={(e) => setHour(e.target.value)}
                inputMode="numeric"
                className="w-20 rounded-lg border px-3 py-2"
                placeholder="HH"
              />
              <span>:</span>
              <input
                value={minute}
                onChange={(e) => setMinute(e.target.value)}
                inputMode="numeric"
                className="w-20 rounded-lg border px-3 py-2"
                placeholder="MM"
              />
            </div>
          </label>

          <label className="block">
            <div className="text-sm font-medium mb-1">Duration (minutes)</div>
            <input
              value={durationMin}
              onChange={(e) => setDurationMin(e.target.value)}
              inputMode="numeric"
              className="w-full rounded-lg border px-3 py-2"
              placeholder="10"
            />
            <div className="text-xs text-gray-500 mt-1">
              Turns ON, then turns OFF after duration.
            </div>
          </label>
        </div>

        <div className="mt-4">
          <div className="text-sm font-medium mb-2">Days</div>
          <div className="flex flex-wrap gap-2">
            {DOW.map((d) => {
              const on = days.includes(d.key);
              return (
                <button
                  key={d.key}
                  type="button"
                  onClick={() => toggleDay(d.key)}
                  className={[
                    "px-3 py-1.5 rounded-full border text-sm",
                    on ? "bg-black text-white" : "hover:bg-gray-50",
                  ].join(" ")}
                >
                  {d.label}
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => setDays([])} // empty => every day
              className="px-3 py-1.5 rounded-full border text-sm hover:bg-gray-50"
              title="Clear selection to run every day"
            >
              Every day
            </button>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <label className="inline-flex items-center gap-2">
            <input
              type="checkbox"
              checked={enabled}
              onChange={(e) => setEnabled(e.target.checked)}
            />
            <span className="text-sm">Enabled</span>
          </label>

          <div className="text-sm text-gray-600">
            <span className="font-medium">Preview:</span>{" "}
            {prettyDays(preview.cron)} • {pad2(hour)}:{pad2(minute)} •{" "}
            {Math.round(preview.duration_sec / 60)} min
            <span className="ml-2 font-mono text-xs text-gray-500">
              ({preview.cron})
            </span>
          </div>
        </div>

        <div className="mt-4">
          <button
            onClick={saveNew}
            disabled={saving}
            className="px-4 py-2 rounded-lg bg-black text-white disabled:opacity-50"
          >
            {saving ? "Saving..." : "Create schedule"}
          </button>
        </div>
      </div>

      {/* Existing schedules */}
      <div className="mt-6 rounded-2xl border p-4 md:p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-lg font-semibold">Existing schedules</h2>
          <button
            onClick={load}
            disabled={loading}
            className="px-3 py-2 rounded-lg border hover:bg-gray-50 disabled:opacity-50"
          >
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="mt-4 text-gray-500">Loading schedules...</div>
        ) : schedules.length === 0 ? (
          <div className="mt-4 text-gray-500">
            No schedules for this actuator yet.
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {schedules.map((s) => {
              const id = getId(s?._id || s?.id);
              const isBusy = busyId === id;

              return (
                <div
                  key={id || Math.random()}
                  className="rounded-xl border p-3 md:p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <div className="font-semibold truncate">
                        {s?.name || "Unnamed schedule"}
                      </div>
                      <span
                        className={[
                          "text-xs px-2 py-0.5 rounded-full border",
                          s?.enabled
                            ? "bg-green-50 border-green-200 text-green-700"
                            : "bg-gray-50 border-gray-200 text-gray-600",
                        ].join(" ")}
                      >
                        {s?.enabled ? "Enabled" : "Disabled"}
                      </span>
                    </div>

                    <div className="mt-1 text-sm text-gray-600">
                      {prettyDays(s?.cron)} • {prettyTime(s?.cron)} •{" "}
                      {Math.round((Number(s?.duration_sec) || 0) / 60) || "—"}{" "}
                      min
                    </div>

                    <div className="mt-1 text-xs text-gray-500 font-mono break-all">
                      id: {id || "—"} • cron: {s?.cron || "—"} • tz:{" "}
                      {s?.timezone || "—"}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => toggleEnabled(s)}
                      disabled={isBusy || !id}
                      className="px-3 py-2 rounded-lg border hover:bg-gray-50 disabled:opacity-50"
                    >
                      {s?.enabled ? "Disable" : "Enable"}
                    </button>

                    <button
                      onClick={() => deleteSchedule(s)}
                      disabled={isBusy || !id}
                      className="px-3 py-2 rounded-lg border border-red-200 text-red-700 hover:bg-red-50 disabled:opacity-50"
                    >
                      Delete
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
