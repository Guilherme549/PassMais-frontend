import { NextRequest } from "next/server";

async function forward(request: NextRequest, doctorId: string) {
  const base = (process.env.NEXT_PUBLIC_API_BASE_URL || "").replace(/\/$/, "");
  if (!base) {
    return new Response(
      JSON.stringify({ message: "NEXT_PUBLIC_API_BASE_URL não definido" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    const payload = await request.json();

    const headers: HeadersInit = {
      "Content-Type": "application/json",
      Accept: "application/json",
    };

    const authHeader = request.headers.get("authorization");
    if (authHeader) {
      headers["Authorization"] = authHeader;
    }

    const upstream = await fetch(`${base}/api/doctors/${doctorId}/schedule`, {
      method: request.method,
      headers,
      body: JSON.stringify(payload),
    });

    const contentType = upstream.headers.get("content-type") || "application/json";
    const bodyText = await upstream.text();

    return new Response(bodyText, {
      status: upstream.status,
      headers: { "Content-Type": contentType },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao comunicar com o serviço de horários";
    return new Response(JSON.stringify({ message: `Proxy error: ${message}` }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

async function getDoctorId(context: { params: Promise<{ doctorId: string }> }) {
  const params = await context.params;
  return params.doctorId;
}

export async function PUT(request: NextRequest, context: { params: Promise<{ doctorId: string }> }) {
  const doctorId = await getDoctorId(context);
  return forward(request, doctorId);
}

export async function POST(request: NextRequest, context: { params: Promise<{ doctorId: string }> }) {
  const doctorId = await getDoctorId(context);
  return forward(request, doctorId);
}
