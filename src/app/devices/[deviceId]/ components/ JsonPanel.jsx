"use client";

function pretty(obj) {
  try {
    return JSON.stringify(obj ?? {}, null, 2);
  } catch {
    return String(obj);
  }
}

export default function JsonPanel({ title, value }) {
  return (
    <div className="rounded-2xl bg-white/5 ring-1 ring-white/10 p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="text-base font-semibold">{title}</h3>
      </div>
      <pre className="max-h-[360px] overflow-auto rounded-xl bg-black/30 p-3 text-xs ring-1 ring-white/10">
        {pretty(value)}
      </pre>
    </div>
  );
}
