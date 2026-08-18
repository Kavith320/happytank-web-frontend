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

export function getActAuto(act) {
  if (!act) return false;
  if (typeof act?.default?.auto === "boolean") return act.default.auto;
  if (typeof act?.auto === "boolean") return act.auto;
  return false;
}

export function getActDesiredState(act) {
  if (!act) return "OFF";
  if (act?.default?.state) return act.default.state.toString().toUpperCase();
  if (act?.state) return act.state.toString().toUpperCase();
  return "OFF";
}

export function getActLiveState(actKey, telemetryActuators, act) {
  const t = telemetryActuators?.[actKey];
  if (t) return (typeof t === "object" ? t.state || "OFF" : t).toString().toUpperCase();
  if (act?.state) return act.state.toString().toUpperCase();
  if (act?.default?.state) return act.default.state.toString().toUpperCase();
  return "OFF";
}

export function normalizeActuators(device) {
  const fromControl = device?.control?.actuators;
  const fromConfig = device?.config?.actuators;
  const fromTelemetry = device?.last_telemetry?.actuators || device?.telemetry?.actuators || {};

  const base =
    (fromControl && typeof fromControl === "object" ? fromControl : null) ||
    (fromConfig && typeof fromConfig === "object" ? fromConfig : null) ||
    {};

  const out = {};
  for (const [k, v] of Object.entries(base)) {
    const actAuto = getActAuto(v);
    const actState = getActLiveState(k, fromTelemetry, v);
    const actType = v?.type || fromConfig?.[k]?.type || fromControl?.[k]?.type || null;

    out[k] = {
      state: actState === "ON" ? "ON" : "OFF",
      auto: Boolean(actAuto),
      type: actType,
      default: v?.default || { auto: Boolean(actAuto), state: actState === "ON" ? "ON" : "OFF" },
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
