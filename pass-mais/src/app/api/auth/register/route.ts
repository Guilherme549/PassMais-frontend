export async function POST(req: Request) {
  try {
    const body = await req.json();

    const upstream = await fetch("https://api.passmais.com.br/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const contentType = upstream.headers.get("content-type") || "application/json";
    const data = contentType.includes("application/json") ? await upstream.json().catch(() => ({})) : await upstream.text();

    return new Response(
      contentType.includes("application/json") ? JSON.stringify(data) : (data as string),
      {
        status: upstream.status,
        headers: { "content-type": contentType },
      }
    );
  } catch (err) {
    return new Response(JSON.stringify({ message: "Proxy error", error: (err as Error).message })),
      { status: 500 } as any;
  }
}

