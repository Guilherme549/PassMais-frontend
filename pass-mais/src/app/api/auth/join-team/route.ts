import { NextResponse } from "next/server";

type JoinTeamPayload = {
    code?: string;
    acceptTerms?: boolean;
};

const MEDICAL_CODES = new Set(["MEDIC-TEAM"]);

export async function POST(request: Request) {
    let body: JoinTeamPayload = {};
    try {
        body = (await request.json()) as JoinTeamPayload;
    } catch {
        // ignore malformed and treat as empty
    }

    if (!body.code || !body.acceptTerms) {
        return NextResponse.json(
            { message: "Informe o código e aceite os termos de uso para continuar." },
            { status: 400 },
        );
    }

    const normalizedCode = body.code.trim().toUpperCase();
    const isDoctorCode = MEDICAL_CODES.has(normalizedCode);

    const redirectTo = isDoctorCode ? "/medicos/dashboard/team" : "/agendas";

    return NextResponse.json({ redirectTo });
}
