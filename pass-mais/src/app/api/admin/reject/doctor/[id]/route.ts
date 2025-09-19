import { NextRequest } from "next/server";

type RouteContext = {
  params?: Promise<Record<string, string | string[] | undefined>>;
};

export async function POST(req: NextRequest, { params }: RouteContext) {
  try {
    const base = (process.env.NEXT_PUBLIC_API_BASE_URL || "").replace(/\/$/, "");
    if (!base) {
      return new Response(
        JSON.stringify({ message: "NEXT_PUBLIC_API_BASE_URL não definido" }),
        { status: 500, headers: { "content-type": "application/json" } }
      );
    }

    const resolvedParams = params ? await params : undefined;
    const rawId = resolvedParams?.id;
    const id = Array.isArray(rawId) ? rawId[0] : rawId;
    if (!id) {
      return new Response(
        JSON.stringify({ message: "Parâmetro id é obrigatório" }),
        { status: 400, headers: { "content-type": "application/json" } }
      );
    }

    const rawBody = await req.text();

    const upstream = await fetch(`${base}/api/admin/reject/doctor/${id}`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        ...buildAuthorizationHeader(req),
      },
      body: rawBody || undefined,
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
