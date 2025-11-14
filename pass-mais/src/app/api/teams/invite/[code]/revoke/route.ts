import { NextRequest } from "next/server";

function getApiBaseUrl() {
    return (process.env.NEXT_PUBLIC_API_BASE_URL || "").replace(/\/$/, "");
}

export async function PATCH(
    request: NextRequest,
    context: { params: Promise<{ code: string }> },
) {
    const baseUrl = getApiBaseUrl();
    if (!baseUrl) {
        return new Response(JSON.stringify({ message: "NEXT_PUBLIC_API_BASE_URL não definido" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }

    const params = await context.params;
    const code = params?.code;
    if (!code) {
        return new Response(JSON.stringify({ message: "Código de convite inválido." }), {
            status: 400,
            headers: { "Content-Type": "application/json" },
        });
    }

    const upstreamUrl = new URL(`${baseUrl}/api/teams/invite/${encodeURIComponent(code)}/revoke`);
    const headers: HeadersInit = {
        Accept: "application/json",
    };
    const authHeader = request.headers.get("authorization");
    if (authHeader) {
        headers["Authorization"] = authHeader;
    }

    try {
        const upstream = await fetch(upstreamUrl, {
            method: "PATCH",
            headers,
            cache: "no-store",
        });

        const contentType = upstream.headers.get("content-type") || "application/json";
        const body = await upstream.text();

        return new Response(body, {
            status: upstream.status,
            headers: { "Content-Type": contentType },
        });
    } catch (error) {
        const message =
            error instanceof Error ? error.message : "Erro ao comunicar com o serviço de revogação de convites";
        return new Response(JSON.stringify({ message: `Proxy error: ${message}` }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }
}
