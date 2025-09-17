import { NextRequest } from "next/server";

// Proxies doctor registration to the backend to avoid CORS issues in the browser.
export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();
    const base = (process.env.NEXT_PUBLIC_API_BASE_URL || "").replace(/\/$/, "");
    if (!base) {
      return new Response(
        JSON.stringify({ message: "NEXT_PUBLIC_API_BASE_URL não definido" }),
        { status: 500, headers: { "content-type": "application/json" } }
      );
    }

    const upstream = await fetch(`${base}/api/registration/doctor`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const contentType = upstream.headers.get("content-type") || "application/json";
    const bodyText = await upstream.text();

    return new Response(bodyText, {
      status: upstream.status,
      headers: { "Content-Type": contentType },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return new Response(JSON.stringify({ message: `Proxy error: ${message}` }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
