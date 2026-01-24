"use client";

import { labelize } from "../../utils/format";
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";

function formatTick(t) {
  const d = new Date(t);
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

export default function SensorChartModal({ open, onClose, sensorKey, data }) {
  if (!open) return null;

  const chartData = (data || []).map((p) => ({ time: p.t, value: p.v }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
      <div className="w-full max-w-3xl rounded-2xl bg-zinc-950 ring-1 ring-white/10 p-4">
        <div className="flex items-center justify-between gap-3 mb-3">
          <div>
            <div className="text-xs opacity-70">Sensor</div>
            <div className="text-lg font-semibold">{labelize(sensorKey)}</div>
          </div>

          <button
            onClick={onClose}
            className="rounded-xl bg-white/10 hover:bg-white/15 ring-1 ring-white/10 px-3 py-2 text-sm"
          >
            Close
          </button>
        </div>

        <div className="h-[320px] rounded-xl bg-black/30 ring-1 ring-white/10 p-2">
          {chartData.length < 2 ? (
            <div className="h-full flex items-center justify-center text-sm opacity-70">
              Not enough data yet. Wait a few refresh cycles.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" tickFormatter={formatTick} minTickGap={24} />
                <YAxis domain={["auto", "auto"]} />
                <Tooltip
                  labelFormatter={(t) => new Date(t).toLocaleString()}
                  formatter={(v) => [v, "Value"]}
                />
                <Line type="monotone" dataKey="value" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
