import { NextResponse } from "next/server";

import { addJoinCodeToStore } from "../mock-data";

function generateJoinCode(): string {
    const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let result = "";
    for (let i = 0; i < 8; i += 1) {
        const index = Math.floor(Math.random() * alphabet.length);
        result += alphabet[index];
        if (i === 3) result += "-";
    }
    return result.toUpperCase();
}

export async function POST(request: Request) {
    let payload: { fullName?: string; email?: string } = {};
    try {
        payload = (await request.json()) as typeof payload;
    } catch {
        // mantém payload vazio para validação abaixo
    }

    const fullName = payload.fullName?.trim();
    const email = payload.email?.trim();

    if (!fullName || !email) {
        return NextResponse.json(
            { message: "Informe o nome completo e o e-mail corporativo da secretária." },
            { status: 400 },
        );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return NextResponse.json(
            { message: "E-mail corporativo inválido. Confira o endereço digitado." },
            { status: 400 },
        );
    }

    const code = generateJoinCode();
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 dias

    const record = {
        id: `code-${Date.now()}`,
        code,
        expiresAt: expiresAt.toISOString(),
        usesLeft: 5,
        status: "ativo" as const,
        secretaryName: fullName,
        secretaryEmail: email,
    };

    addJoinCodeToStore(record);

    return NextResponse.json(record);
}
