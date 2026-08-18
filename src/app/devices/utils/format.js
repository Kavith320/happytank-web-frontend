export function fmtTime(ts) {
  if (!ts) return "—";
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString();
}

export function labelize(key) {
  return String(key)
    .replaceAll("_", " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/\b\w/g, (m) => m.toUpperCase());
}

export function isOnlineFromLastTelemetry(lastTelemetry, minutes = 2) {
  if (!lastTelemetry) return false;
  const t = new Date(lastTelemetry).getTime();
  if (Number.isNaN(t)) return false;
  return Date.now() - t < minutes * 60 * 1000;
}
