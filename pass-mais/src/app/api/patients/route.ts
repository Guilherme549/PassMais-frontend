import { NextRequest } from "next/server";

const API_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL || "").replace(/\/$/, "");

export async function POST(req: NextRequest) {
  if (!API_BASE) {
    return new Response(JSON.stringify({ message: "NEXT_PUBLIC_API_BASE_URL não definido" }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }

  try {
    const body = await req.text();
    const auth = req.headers.get("authorization") || "";

    const upstream = await fetch(`${API_BASE}/api/patients`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        ...(auth ? { Authorization: auth } : {}),
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
    const message = error instanceof Error ? error.message : "Erro ao acessar o backend.";
    return new Response(JSON.stringify({ message }), {
      status: 502,
      headers: { "content-type": "application/json" },
    });
  }
}
