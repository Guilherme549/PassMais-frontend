const API_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL || "").replace(/\/$/, "");

export async function GET(request: Request) {
    if (!API_BASE) {
        return new Response(JSON.stringify({ message: "NEXT_PUBLIC_API_BASE_URL não definido" }), {
            status: 500,
            headers: { "content-type": "application/json" },
        });
    }

    const headers = new Headers({
        Accept: "application/json",
    });

    const authHeader = request.headers.get("authorization");
    if (authHeader) {
        headers.set("Authorization", authHeader);
    }

    try {
        const upstream = await fetch(`${API_BASE}/api/patients/appointments`, {
            method: "GET",
            headers,
            cache: "no-store",
        });

        const contentType = upstream.headers.get("content-type") || "application/json";
        const payload = await upstream.text();

        return new Response(payload, {
            status: upstream.status,
            headers: { "content-type": contentType },
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Erro ao carregar as consultas do paciente.";
        return new Response(JSON.stringify({ message }), {
            status: 502,
            headers: { "content-type": "application/json" },
        });
    }
}
