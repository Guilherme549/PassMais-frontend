import { NextRequest } from "next/server";

// Proxies doctor registration to the backend to avoid CORS issues in the browser.
export async function POST(req: NextRequest) {
  try {
    const base = (process.env.NEXT_PUBLIC_API_BASE_URL || "").replace(/\/$/, "");
    if (!base) {
      return new Response(
        JSON.stringify({ message: "NEXT_PUBLIC_API_BASE_URL não definido" }),
        { status: 500, headers: { "content-type": "application/json" } }
      );
    }

    const contentType = req.headers.get("content-type") || "";

    let upstreamBody: BodyInit | null = null;
    const upstreamHeaders: HeadersInit = {};

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const forward = new FormData();

      formData.forEach((value, key) => {
        if (typeof value === "string") {
          forward.append(key, value);
          return;
        }

        if (value instanceof File) {
          forward.append(key, value, value.name);
          return;
        }

        forward.append(key, value as unknown as Blob);
      });

      upstreamBody = forward;
    } else if (contentType.includes("application/json")) {
      const payload = await req.json();
      upstreamHeaders["Content-Type"] = "application/json";
      upstreamBody = JSON.stringify(payload);
    } else {
      const rawBody = await req.arrayBuffer();
      upstreamBody = Buffer.from(rawBody);
      if (contentType) {
        upstreamHeaders["Content-Type"] = contentType;
      }
    }

    const upstream = await fetch(`${base}/api/registration/doctor`, {
      method: "POST",
      headers: upstreamHeaders,
      body: upstreamBody,
    });

    const upstreamContentType = upstream.headers.get("content-type") || "application/json";
    const bodyText = await upstream.text();

    return new Response(bodyText, {
      status: upstream.status,
      headers: { "Content-Type": upstreamContentType },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return new Response(JSON.stringify({ message: `Proxy error: ${message}` }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
