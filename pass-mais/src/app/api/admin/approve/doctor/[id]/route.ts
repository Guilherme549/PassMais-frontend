import { NextRequest } from "next/server";

type RouteParams = { params: { id: string } | Promise<{ id: string }> };

export async function POST(req: NextRequest, context: RouteParams) {
  try {
    const base = (process.env.NEXT_PUBLIC_API_BASE_URL || "").replace(/\/$/, "");
    if (!base) {
      return new Response(
        JSON.stringify({ message: "NEXT_PUBLIC_API_BASE_URL não definido" }),
        { status: 500, headers: { "content-type": "application/json" } }
      );
    }

    const params = await Promise.resolve(context.params);
    const { id } = params;
    if (!id) {
      return new Response(
        JSON.stringify({ message: "Parâmetro id é obrigatório" }),
        { status: 400, headers: { "content-type": "application/json" } }
      );
    }

    const upstream = await fetch(`${base}/api/admin/approve/doctor/${id}`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        ...buildAuthorizationHeader(req),
      },
    });

    const contentType = upstream.headers.get("content-type") || "application/json";
    const body = await upstream.text();

    return new Response(body, {
      status: upstream.status,
      headers: { "content-type": contentType },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return new Response(
      JSON.stringify({ message: "Proxy error", error: message }),
      { status: 500, headers: { "content-type": "application/json" } }
    );
  }
}

function buildAuthorizationHeader(req: NextRequest) {
  const auth = req.headers.get("authorization");
  return auth ? { Authorization: auth } : {};
}
