"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiGet } from "../lib/api";

function statusDot(device) {
  return device?.last_telemetry ? "bg-green-500" : "bg-red-500";
}
function statusText(device) {
  return device?.last_telemetry ? "Online" : "Offline";
}

export default function HomePage() {
  const router = useRouter();
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;

    async function load() {
      setLoading(true);
      setError("");

      try {
        const res = await apiGet("/api/devices");
        const list = res?.devices || [];
        if (alive) setDevices(list);
      } catch (err) {
        if (alive) setError(err.message || "Failed to load devices");
      } finally {
        if (alive) setLoading(false);
      }
    }

    load();
    return () => (alive = false);
  }, []);

  return (
    <div className="min-h-screen p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">All Devices</h1>
          <p className="text-sm text-muted">
            {loading ? "Loading..." : `${devices.length} device(s)`}
          </p>
        </div>

        <button
          className="border rounded-lg px-3 py-2"
          onClick={() => router.push("/logout")}
        >
          Logout
        </button>
      </div>

      {error && (
        <div className="mt-4 p-3 rounded bg-red-100 text-red-700 text-sm">
          {error}
        </div>
      )}

      <div className="mt-6">
        {loading ? (
          <div className="card">Loading devices...</div>
        ) : devices.length === 0 ? (
          <div className="card text-center py-10">
            <h2 className="text-lg font-semibold">No devices found</h2>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {devices.map((d) => {
              const name = d?.config?.device?.name || "Unnamed Device";
              const model = d?.config?.device?.model || "—";
              const fw = d?.config?.device?.fw || d?.config?.device?.fw_name || "—";

              const temp = d?.last_telemetry?.t ?? "—";
              const hum = d?.last_telemetry?.h ?? "—";
              const ph = d?.last_telemetry?.ph ?? "—";

              return (
                <button
                  key={d.deviceId}
                  type="button"
                  className="card text-left hover:shadow-lg transition"
                  onClick={() => router.push(`/devices/${d.deviceId}`)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-semibold">{name}</h3>
                      <p className="text-sm text-muted mt-1">ID: {d.deviceId}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`h-2.5 w-2.5 rounded-full ${statusDot(d)}`} />
                      <span className="text-sm">{statusText(d)}</span>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-2 text-sm">
                    <div className="rounded-lg border p-2">
                      <div className="text-muted text-xs">Temp</div>
                      <div className="font-semibold">{temp}</div>
                    </div>
                    <div className="rounded-lg border p-2">
                      <div className="text-muted text-xs">Humidity</div>
                      <div className="font-semibold">{hum}</div>
                    </div>
                    <div className="rounded-lg border p-2">
                      <div className="text-muted text-xs">pH</div>
                      <div className="font-semibold">{ph}</div>
                    </div>
                  </div>

                  <div className="mt-4 text-sm text-cyan-600">Open device →</div>
                  <div className="mt-3 text-xs text-muted">
                    Model: {model} • FW: {fw}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
