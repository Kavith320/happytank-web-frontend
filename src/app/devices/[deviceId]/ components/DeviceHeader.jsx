"use client";

import { fmtTime, isOnlineFromLastTelemetry } from "../../utils/format";

function Badge({ ok, children }) {
  return (
    <span
      className={
        "inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm " +
        (ok
          ? "bg-emerald-500/15 text-emerald-200 ring-1 ring-emerald-400/30"
          : "bg-rose-500/15 text-rose-200 ring-1 ring-rose-400/30")
      }
    >
      <span className={"h-2 w-2 rounded-full " + (ok ? "bg-emerald-300" : "bg-rose-300")} />
      {children}
    </span>
  );
}

export default function DeviceHeader({
  title,
  deviceId,
  lastTelemetry,
  telemetryTopic,
  controlTopic,
  refreshing,
  onRefresh,
  onBack,
}) {
  const online = isOnlineFromLastTelemetry(lastTelemetry, 2);

  return (
    <div className="flex flex-col gap-3 rounded-2xl bg-white/5 ring-1 ring-white/10 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-[220px]">
          <div className="text-xs opacity-70">Device</div>
          <div className="text-xl font-bold">{title}</div>
          <div className="mt-1 text-xs opacity-70">
            ID: <span className="opacity-90">{deviceId}</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Badge ok={online}>{online ? "Online" : "Offline"}</Badge>

          <button
            onClick={onRefresh}
            className="rounded-xl bg-white/10 hover:bg-white/15 ring-1 ring-white/10 px-4 py-2 text-sm"
            disabled={refreshing}
          >
            {refreshing ? "Refreshing…" : "Refresh"}
          </button>

          <button
            onClick={onBack}
            className="rounded-xl bg-white/10 hover:bg-white/15 ring-1 ring-white/10 px-4 py-2 text-sm"
          >
            Back
          </button>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <div className="rounded-xl bg-black/20 ring-1 ring-white/10 p-3">
          <div className="text-xs opacity-70">Last Telemetry</div>
          <div className="text-sm font-medium">{fmtTime(lastTelemetry)}</div>
        </div>

        <div className="rounded-xl bg-black/20 ring-1 ring-white/10 p-3">
          <div className="text-xs opacity-70">Telemetry Topic</div>
          <div className="text-sm font-medium break-all">{telemetryTopic || "—"}</div>
        </div>

        <div className="rounded-xl bg-black/20 ring-1 ring-white/10 p-3">
          <div className="text-xs opacity-70">Control Topic</div>
          <div className="text-sm font-medium break-all">{controlTopic || "—"}</div>
        </div>
      </div>
    </div>
  );
}
