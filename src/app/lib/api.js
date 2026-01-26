import { getToken } from "./auth";

// ✅ Your backend is on port 3000
const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

async function safeJson(res) {
  try {
    return await res.json();
  } catch {
    return {};
  }
}

function extractError(data, res) {
  // Your backend returns: { ok:false, error:"..." }
  // Some APIs return: { message:"..." }
  return (
    data?.error ||
    data?.message ||
    `Request failed (${res.status})`
  );
}

export async function apiGet(path) {
  const token = getToken();

  const res = await fetch(`${BASE}${path}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  const data = await safeJson(res);
  if (!res.ok) throw new Error(extractError(data, res));
  return data;
}

export async function apiPost(path, body) {
  const token = getToken();

  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });

  const data = await safeJson(res);
  if (!res.ok) throw new Error(extractError(data, res));
  return data;
}

export async function apiPut(path, body) {
  return apiRequest(path, "PUT", body);
}
export async function apiPatch(path, body) {
  return apiRequest(path, "PATCH", body);
}
export async function apiDelete(path) {
  return apiRequest(path, "DELETE");
}

async function apiRequest(path, method, body) {
  const token = getToken();

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });

  const data = await safeJson(res);
  if (!res.ok) throw new Error(extractError(data, res));
  return data;
}
