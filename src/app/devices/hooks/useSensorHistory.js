"use client";

import { useEffect, useMemo, useState } from "react";
import { extractNumericSensors } from "../utils/normalize";

export function useSensorHistory(telemetry, { maxPoints = 60 } = {}) {
  const [history, setHistory] = useState({});
  const numericSensors = useMemo(() => extractNumericSensors(telemetry), [telemetry]);

  useEffect(() => {
    const now = Date.now();
    const timer = setTimeout(() => {
      setHistory((prev) => {
        const next = { ...prev };

        for (const [k, v] of Object.entries(numericSensors)) {
          const arr = next[k] ? [...next[k]] : [];
          arr.push({ t: now, v: Number(v) });
          if (arr.length > maxPoints) arr.splice(0, arr.length - maxPoints);
          next[k] = arr;
        }

        return next;
      });
    }, 0);

    return () => clearTimeout(timer);
  }, [numericSensors, maxPoints]);

  return { history, numericSensors };
}
