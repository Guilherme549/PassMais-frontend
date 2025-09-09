export async function POST(req: Request) {
  try {
    const body = await req.json();

    const apiBase = process.env.API_URL || process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
    const url = `${apiBase.replace(/\/$/, "")}/api/auth/login`;

    const upstream = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const contentType = upstream.headers.get("content-type") || "application/json";
    const text = await upstream.text();
    const isJson = contentType.includes("application/json");

    // Helpful server-side log for debugging
    console.log(`[proxy] POST /api/auth/login -> ${url} :: ${upstream.status}`);
    if (!upstream.ok) {
      console.warn(`[proxy] upstream non-OK: ${upstream.status} body=`, text);
    }

    return new Response(text, {
      status: upstream.status,
      headers: { "content-type": isJson ? "application/json" : contentType },
    });
  } catch (err) {
    console.error("[proxy] /api/auth/login error:", err);
    return new Response(
      JSON.stringify({ message: "Proxy error", error: (err as Error).message }),
      { status: 500, headers: { "content-type": "application/json" } }
    );
  }
}
