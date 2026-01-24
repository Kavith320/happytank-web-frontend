"use client";

import { useMemo, useState } from "react";
import SensorCard from "./SensorCard";
import SensorChartModal from "./SensorChartModal";

export default function SensorsSection({ telemetry, history }) {
  const [openKey, setOpenKey] = useState(null);

  const entries = useMemo(() => {
    const out = [];
    for (const [k, v] of Object.entries(telemetry || {})) {
      if (v == null) continue;
      if (typeof v === "object") continue;
      if (String(k).toLowerCase().includes("topic")) continue;
      out.push([k, v]);
    }
    out.sort(([a], [b]) => a.localeCompare(b));
    return out;
  }, [telemetry]);

  return (
    <div className="rounded-2xl bg-white/5 ring-1 ring-white/10 p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="text-base font-semibold">Sensors</h3>
        <span className="text-xs opacity-70">Tap a sensor to see its graph</span>
      </div>

      {entries.length === 0 ? (
        <div className="text-sm opacity-70">No sensor values found.</div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {entries.map(([k, v]) => (
            <SensorCard key={k} sensorKey={k} value={v} onClick={() => setOpenKey(k)} />
          ))}
        </div>
      )}

      <SensorChartModal
        open={Boolean(openKey)}
        sensorKey={openKey || ""}
        data={openKey ? history?.[openKey] : []}
        onClose={() => setOpenKey(null)}
      />
    </div>
  );
}
