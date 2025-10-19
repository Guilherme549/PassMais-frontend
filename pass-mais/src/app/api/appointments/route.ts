import { NextRequest, NextResponse } from "next/server";

type MockAppointment = {
  id: string;
  patientName: string;
  scheduledAt: string;
  location: string;
  status: string;
  doctorId: string;
};

const MOCK_APPOINTMENTS: MockAppointment[] = [
  {
    id: "apt-001",
    patientName: "Ana Oliveira",
    scheduledAt: "2024-06-01T09:00:00-03:00",
    location: "Clínica Vida Plena - Sala 3",
    status: "confirmada",
    doctorId: "doc-carlos",
  },
  {
    id: "apt-002",
    patientName: "Carlos Souza",
    scheduledAt: "2024-06-01T11:30:00-03:00",
    location: "Clínica Vida Plena - Sala 2",
    status: "confirmada",
    doctorId: "doc-carlos",
  },
  {
    id: "apt-003",
    patientName: "Beatriz Mendes",
    scheduledAt: "2024-06-02T15:00:00-03:00",
    location: "Hospital São Lucas - Consultório 5",
    status: "pendente",
    doctorId: "doc-joana",
  },
  {
    id: "apt-004",
    patientName: "Júlio Cesar",
    scheduledAt: "2024-06-03T10:15:00-03:00",
    location: "Hospital São Lucas - Consultório 7",
    status: "confirmada",
    doctorId: "doc-fernando",
  },
];

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

  const searchParams = req.nextUrl.searchParams;
  const doctorIds = searchParams.getAll("doctorId").filter(Boolean);
  const from = searchParams.get("from") ?? null;
  const to = searchParams.get("to") ?? null;

  const filtered = MOCK_APPOINTMENTS.filter((appointment) => {
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
