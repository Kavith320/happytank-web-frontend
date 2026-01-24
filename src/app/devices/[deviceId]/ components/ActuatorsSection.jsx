"use client";

import { useState } from "react";
import { labelize } from "../../utils/format";

export default function ActuatorsSection({ actuators, setDevice, sendControl, onAfterSend }) {
  const [saving, setSaving] = useState({});

  const toggleState = async (name) => {
    const current = actuators[name];
    const nextState = current.state === "ON" ? "OFF" : "ON";

    setDevice((prev) => {
      const copy = structuredClone(prev || {});
      copy.control = copy.control || {};
      copy.control.actuators = copy.control.actuators || {};
      copy.control.actuators[name] = { ...current, state: nextState };
      return copy;
    });

    setSaving((s) => ({ ...s, [name]: true }));
    try {
      await sendControl({ actuators: { [name]: { state: nextState, auto: current.auto } } });
      onAfterSend?.();
    } finally {
      setSaving((s) => ({ ...s, [name]: false }));
    }
  };

  const toggleAuto = async (name) => {
    const current = actuators[name];
    const nextAuto = !current.auto;

    setDevice((prev) => {
      const copy = structuredClone(prev || {});
      copy.control = copy.control || {};
      copy.control.actuators = copy.control.actuators || {};
      copy.control.actuators[name] = { ...current, auto: nextAuto };
      return copy;
    });

    setSaving((s) => ({ ...s, [name]: true }));
    try {
      await sendControl({ actuators: { [name]: { state: current.state, auto: nextAuto } } });
      onAfterSend?.();
    } finally {
      setSaving((s) => ({ ...s, [name]: false }));
    }
  };

  const keys = Object.keys(actuators || {});
  return (
    <div className="rounded-2xl bg-white/5 ring-1 ring-white/10 p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="text-base font-semibold">Actuators</h3>
      </div>

      {keys.length === 0 ? (
        <div className="text-sm opacity-70">No actuators found.</div>
      ) : (
        <div className="space-y-3">
          {keys.map((name) => {
            const a = actuators[name];
            const busy = Boolean(saving[name]);
            const on = a.state === "ON";

            return (
              <div
                key={name}
                className="flex flex-col gap-3 rounded-2xl bg-black/20 ring-1 ring-white/10 p-4 md:flex-row md:items-center md:justify-between"
              >
                <div className="min-w-[220px]">
                  <div className="text-sm font-semibold">{labelize(name)}</div>
                  <div className="mt-1 text-xs opacity-80">
                    State: <span className="opacity-100">{a.state}</span> • Auto:{" "}
                    <span className="opacity-100">{a.auto ? "ON" : "OFF"}</span>
                    {busy ? <span className="ml-2 opacity-70">Saving…</span> : null}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => toggleState(name)}
                    disabled={busy}
                    className={
                      "rounded-xl px-4 py-2 text-sm ring-1 " +
                      (on
                        ? "bg-rose-500/15 hover:bg-rose-500/20 ring-rose-400/30"
                        : "bg-emerald-500/15 hover:bg-emerald-500/20 ring-emerald-400/30")
                    }
                  >
                    {on ? "Turn OFF" : "Turn ON"}
                  </button>

                  <button
                    onClick={() => toggleAuto(name)}
                    disabled={busy}
                    className="rounded-xl bg-white/10 hover:bg-white/15 ring-1 ring-white/10 px-4 py-2 text-sm"
                  >
                    {a.auto ? "Disable Auto" : "Enable Auto"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
