export async function POST(req: Request) {
  try {
    const body = await req.json();

    const apiUrl = process.env.API_URL as string; // definido no .env
    const upstream = await fetch(`${apiUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const ct = upstream.headers.get("content-type") || "";
    const text = await upstream.text();

    console.log("[proxy] /api/medicos/auth/login =>", upstream.status, ct, text);

    const isJson = ct.includes("application/json");
    return new Response(text, {
      status: upstream.status,
      headers: { "content-type": isJson ? "application/json" : ct || "text/plain; charset=utf-8" },
    });
  } catch (err) {
    console.error("[proxy] /api/medicos/auth/login error:", err);
    return new Response(
      JSON.stringify({ message: "Proxy error", error: (err as Error).message }),
      { status: 500, headers: { "content-type": "application/json" } }
    );
  }
}
