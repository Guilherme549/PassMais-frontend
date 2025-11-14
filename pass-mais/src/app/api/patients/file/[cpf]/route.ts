import { NextRequest } from "next/server";

const API_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL || "").replace(/\/$/, "");

export async function GET(req: NextRequest, context: { params: Promise<{ cpf: string }> }) {
  if (!API_BASE) {
    return new Response(JSON.stringify({ message: "NEXT_PUBLIC_API_BASE_URL não definido" }), {
      status: 500,
      headers: { "content-type": "application/json" },
    });
  }

  const params = await context.params;
  const cpf = params.cpf?.trim();
  if (!cpf) {
    return new Response(JSON.stringify({ message: "CPF não informado." }), {
      status: 400,
      headers: { "content-type": "application/json" },
    });
  }

  try {
    const auth = req.headers.get("authorization") || "";
    const upstream = await fetch(`${API_BASE}/api/patients/file/${cpf}`, {
      method: "GET",
      headers: {
        Accept: "application/json",
        ...(auth ? { Authorization: auth } : {}),
      },
      cache: "no-store",
    });

    const contentType = upstream.headers.get("content-type") || "application/json";
    const body = await upstream.text();

    return new Response(body, {
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
