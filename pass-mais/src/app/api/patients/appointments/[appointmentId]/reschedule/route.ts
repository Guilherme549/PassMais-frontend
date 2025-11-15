const API_BASE = (process.env.NEXT_PUBLIC_API_BASE_URL || "").replace(/\/$/, "");

export async function POST(request: Request, context: { params: Promise<{ appointmentId: string }> }) {
    if (!API_BASE) {
        return new Response(JSON.stringify({ message: "NEXT_PUBLIC_API_BASE_URL não definido" }), {
            status: 500,
            headers: { "content-type": "application/json" },
        });
    }

    const params = await context.params;
    const appointmentId = params?.appointmentId?.trim();

    if (!appointmentId) {
        return new Response(JSON.stringify({ message: "Identificador da consulta inválido." }), {
            status: 400,
            headers: { "content-type": "application/json" },
        });
    }

    let payload: string;
    try {
        payload = await request.text();
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
        const upstream = await fetch(
            `${API_BASE}/api/patients/appointments/${encodeURIComponent(appointmentId)}/reschedule`,
            {
                method: "POST",
                headers,
                body: payload || "{}",
                cache: "no-store",
            }
        );

        const contentType = upstream.headers.get("content-type") || "application/json";
        const responseBody = await upstream.text();

        return new Response(responseBody, {
            status: upstream.status,
            headers: { "content-type": contentType },
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Erro ao reagendar a consulta.";
        return new Response(JSON.stringify({ message }), {
            status: 502,
            headers: { "content-type": "application/json" },
        });
    }
}
