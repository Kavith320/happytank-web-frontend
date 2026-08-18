export function normalizeDevice(raw) {
  return raw?.device ?? raw ?? null;
}

export function normalizeTelemetry(device) {
  const t =
    device?.telemetry ||
    device?.lastTelemetry ||
    device?.data ||
    device?.status?.telemetry ||
    {};

  const latest = t?.latest && typeof t.latest === "object" ? t.latest : t;
  return latest && typeof latest === "object" ? latest : {};
}

export function normalizeActuators(device) {
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

export function extractNumericSensors(telemetry) {
  const out = {};
  for (const [k, v] of Object.entries(telemetry || {})) {
    if (v == null) continue;
    if (typeof v === "number") out[k] = v;
    else if (typeof v === "string") {
      const n = Number(v);
      if (!Number.isNaN(n) && v.trim() !== "") out[k] = n;
    }
  }
  return out;
}
