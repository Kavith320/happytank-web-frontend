import { NextResponse } from "next/server";

const BACKEND_BASE = process.env.BACKEND_BASE_URL || "http://213.199.51.193:4000";

function pickAuthHeader(req) {
  const auth = req.headers.get("authorization");
  return auth ? { Authorization: auth } : {};
}

export async function GET(req, { params }) {
  const { scheduleId } = params;

  const upstream = await fetch(
    `${BACKEND_BASE}/api/schedules/${encodeURIComponent(scheduleId)}`,
    {
      method: "GET",
      headers: { ...pickAuthHeader(req) },
      cache: "no-store",
    }
  );

  const text = await upstream.text();
  return new NextResponse(text, {
    status: upstream.status,
    headers: { "Content-Type": upstream.headers.get("content-type") || "application/json" },
  });
}

export async function DELETE(req, { params }) {
  const { scheduleId } = params;

  const upstream = await fetch(
    `${BACKEND_BASE}/api/schedules/${encodeURIComponent(scheduleId)}`,
    {
      method: "DELETE",
      headers: { ...pickAuthHeader(req) },
    }
  );

  const text = await upstream.text();
  return new NextResponse(text, {
    status: upstream.status,
    headers: { "Content-Type": upstream.headers.get("content-type") || "application/json" },
  });
}

// Update schedule (full replace)
export async function PUT(req, { params }) {
  const { scheduleId } = params;
  const body = await req.json();

  const upstream = await fetch(
    `${BACKEND_BASE}/api/schedules/${encodeURIComponent(scheduleId)}`,
    {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        ...pickAuthHeader(req),
      },
      body: JSON.stringify(body),
    }
  );

  const text = await upstream.text();
  return new NextResponse(text, {
    status: upstream.status,
    headers: { "Content-Type": upstream.headers.get("content-type") || "application/json" },
  });
}

// Optional partial update (if your backend supports PATCH)
export async function PATCH(req, { params }) {
  const { scheduleId } = params;
  const body = await req.json();

  const upstream = await fetch(
    `${BACKEND_BASE}/api/schedules/${encodeURIComponent(scheduleId)}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        ...pickAuthHeader(req),
      },
      body: JSON.stringify(body),
    }
  );

  const text = await upstream.text();
  return new NextResponse(text, {
    status: upstream.status,
    headers: { "Content-Type": upstream.headers.get("content-type") || "application/json" },
  });
}
