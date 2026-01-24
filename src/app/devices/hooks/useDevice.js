"use client";

import { useCallback, useEffect, useState } from "react";
import { apiGet, apiPost } from "../../lib/api";
import { removeToken } from "../../lib/auth";
import { normalizeDevice } from "../utils/normalize";

export function useDevice(deviceId, { pollMs = 3000, router } = {}) {
  const [device, setDevice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");

  const fetchDevice = useCallback(
    async ({ silent = false } = {}) => {
      try {
        if (!silent) {
          setRefreshing(true);
          setError("");
        }
        const data = await apiGet(`/api/devices/${deviceId}`);
        setDevice(normalizeDevice(data));
      } catch (e) {
        const msg = e?.message || "Failed to load device";
        setError(msg);

        if (String(msg).toLowerCase().includes("unauthorized")) {
          removeToken();
          router?.replace?.("/login");
        }
      } finally {
        if (!silent) setRefreshing(false);
        setLoading(false);
      }
    },
    [deviceId, router]
  );

  useEffect(() => {
    fetchDevice({ silent: false });
  }, [fetchDevice]);

  useEffect(() => {
    const id = setInterval(() => fetchDevice({ silent: true }), pollMs);
    return () => clearInterval(id);
  }, [fetchDevice, pollMs]);

  const sendControl = useCallback(
    async (body) => {
      setError("");
      return apiPost(`/api/devices/${deviceId}/control`, body);
    },
    [deviceId]
  );

  return { device, setDevice, loading, refreshing, error, fetchDevice, sendControl };
}
