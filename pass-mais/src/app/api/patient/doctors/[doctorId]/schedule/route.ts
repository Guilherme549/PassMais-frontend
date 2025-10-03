import { NextRequest } from "next/server";

async function getDoctorId(context: { params: Promise<{ doctorId: string }> }) {
  const params = await context.params;
  return params.doctorId;
}

export async function GET(request: NextRequest, context: { params: Promise<{ doctorId: string }> }) {
  const doctorId = await getDoctorId(context);
  const base = (process.env.NEXT_PUBLIC_API_BASE_URL || "").replace(/\/$/, "");

  if (!base) {
    return new Response(
      JSON.stringify({ message: "NEXT_PUBLIC_API_BASE_URL não definido" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  try {
    const headers: HeadersInit = {
      Accept: "application/json",
    };
    const authHeader = request.headers.get("authorization");
    if (authHeader) {
      headers["Authorization"] = authHeader;
    }

    const upstream = await fetch(`${base}/api/patient/doctors/${doctorId}/schedule`, {
      method: "GET",
      headers,
    });

    const contentType = upstream.headers.get("content-type") || "application/json";
    const bodyText = await upstream.text();

    return new Response(bodyText, {
      status: upstream.status,
      headers: { "Content-Type": contentType },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro ao consultar agenda";
    return new Response(JSON.stringify({ message: `Proxy error: ${message}` }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
