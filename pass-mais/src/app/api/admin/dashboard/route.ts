import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  try {
    const base = (process.env.NEXT_PUBLIC_API_BASE_URL || "").replace(/\/$/, "");
    if (!base) {
      return new Response(
        JSON.stringify({ message: "NEXT_PUBLIC_API_BASE_URL não definido" }),
        { status: 500, headers: { "content-type": "application/json" } }
      );
    }

    const url = `${base}/api/admin/dashboard`;
    const auth = req.headers.get("authorization") || "";

    const upstream = await fetch(url, {
      method: "GET",
      headers: {
        ...(auth ? { Authorization: auth } : {}),
        Accept: "application/json",
      },
      cache: "no-store",
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

