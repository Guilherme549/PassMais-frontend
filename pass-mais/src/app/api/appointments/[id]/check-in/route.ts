const API_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL || "").replace(/\/$/, "");

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
    if (!API_BASE) {
        return new Response(JSON.stringify({ message: "NEXT_PUBLIC_API_BASE_URL não definido" }), {
            status: 500,
            headers: { "content-type": "application/json" },
        });
    }

    const params = await context.params;
    const id = params?.id?.trim();

    if (!id) {
        return new Response(JSON.stringify({ message: "Agendamento inválido." }), {
            status: 400,
            headers: { "content-type": "application/json" },
        });
    }

    let rawBody: string;
    try {
        rawBody = await request.text();
    } catch {
        return new Response(JSON.stringify({ message: "Não foi possível ler os dados enviados." }), {
            status: 400,
            headers: { "content-type": "application/json" },
        });
    }

    const headers = new Headers({
        "Content-Type": "application/json",
        Accept: "application/json",
    });

    const authHeader = request.headers.get("authorization");
    if (authHeader) {
        headers.set("Authorization", authHeader);
    }

    try {
        const upstream = await fetch(`${API_BASE}/api/appointments/${encodeURIComponent(id)}/check-in`, {
            method: "POST",
            headers,
            body: rawBody,
            cache: "no-store",
        });

        const contentType = upstream.headers.get("content-type") || "application/json";
        const payload = await upstream.text();

        return new Response(payload, {
            status: upstream.status,
            headers: { "content-type": contentType },
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Erro ao confirmar o atendimento.";
        return new Response(JSON.stringify({ message }), {
            status: 502,
            headers: { "content-type": "application/json" },
        });
    }
}
