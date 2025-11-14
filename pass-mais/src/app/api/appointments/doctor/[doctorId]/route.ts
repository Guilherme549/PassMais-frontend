import { NextRequest } from "next/server";

function getBaseUrl() {
  return (process.env.NEXT_PUBLIC_API_BASE_URL || "").replace(/\/$/, "");
}

async function getDoctorId(context: { params: Promise<{ doctorId: string }> }) {
  const params = await context.params;
  return params.doctorId;
}

export async function GET(request: NextRequest, context: { params: Promise<{ doctorId: string }> }) {
  const baseUrl = getBaseUrl();
  if (!baseUrl) {
    return new Response(JSON.stringify({ message: "NEXT_PUBLIC_API_BASE_URL não definido" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const doctorId = await getDoctorId(context);
  const upstreamUrl = `${baseUrl}/api/appointments/doctor/${doctorId}${request.nextUrl.search}`;

  const headers: HeadersInit = {
    Accept: "application/json",
  };
  const authHeader = request.headers.get("authorization");
  if (authHeader) {
    headers["Authorization"] = authHeader;
  }

  try {
    const upstream = await fetch(upstreamUrl, {
      method: "GET",
      headers,
      cache: "no-store",
    });

    const contentType = upstream.headers.get("content-type") || "application/json";
    const body = await upstream.text();

    return new Response(body, {
      status: upstream.status,
      headers: { "Content-Type": contentType },
    });
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : "Erro ao consultar agendamentos do médico";
    return new Response(JSON.stringify({ message: `Proxy error: ${message}` }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
