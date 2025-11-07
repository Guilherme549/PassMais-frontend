import { NextRequest, NextResponse } from "next/server";

import { getAppointmentsSnapshot } from "./mock-data";

export async function GET(req: NextRequest) {
  const base = (process.env.NEXT_PUBLIC_API_BASE_URL || "").replace(/\/$/, "");
  if (base) {
    try {
      const auth = req.headers.get("authorization") || "";
      const upstream = await fetch(`${base}/api/appointments${req.nextUrl.search}`, {
        method: "GET",
        headers: {
          ...(auth ? { Authorization: auth } : {}),
          Accept: "application/json",
        },
        cache: "no-store",
      });

      const contentType = upstream.headers.get("content-type") || "application/json";
      const payload = await upstream.text();

      if (upstream.ok) {
        return new Response(payload, {
          status: upstream.status,
          headers: { "content-type": contentType },
        });
      }

      if (![401, 403, 404].includes(upstream.status)) {
        return new Response(payload, {
          status: upstream.status,
          headers: { "content-type": contentType },
        });
      }
      // Otherwise, fall back to local mock data (e.g., when missing auth)
    } catch (error) {
      // If the upstream request fails (network, timeout, etc.) fall back to mock data below
    }
  }

  const searchParams = req.nextUrl.searchParams;
  const doctorIds = searchParams.getAll("doctorId").filter(Boolean);
  const from = searchParams.get("from") ?? null;
  const to = searchParams.get("to") ?? null;

  const filtered = getAppointmentsSnapshot().filter((appointment) => {
    const matchesDoctor =
      doctorIds.length === 0 ? true : doctorIds.includes(appointment.doctorId);

    const appointmentDate = new Date(appointment.scheduledAt).getTime();
    const matchesFrom = from ? appointmentDate >= new Date(from).getTime() : true;
    const matchesTo = to ? appointmentDate <= new Date(to).getTime() : true;

    return matchesDoctor && matchesFrom && matchesTo;
  });

  return NextResponse.json(filtered);
}

export async function POST(req: NextRequest) {
  const base = (process.env.NEXT_PUBLIC_API_BASE_URL || "").replace(/\/$/, "");
  if (!base) {
    return new Response(
      JSON.stringify({ message: "NEXT_PUBLIC_API_BASE_URL não definido" }),
      { status: 500, headers: { "content-type": "application/json" } }
    );
  }

  try {
    const auth = req.headers.get("authorization") || "";
    const body = await req.text();

    const upstream = await fetch(`${base}/api/appointments`, {
      method: "POST",
      headers: {
        ...(auth ? { Authorization: auth } : {}),
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body,
      cache: "no-store",
    });

    const contentType = upstream.headers.get("content-type") || "application/json";
    const payload = await upstream.text();

    return new Response(payload, {
      status: upstream.status,
      headers: { "content-type": contentType },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ message: "Proxy error", error: message }),
      { status: 500, headers: { "content-type": "application/json" } }
    );
  }
}
