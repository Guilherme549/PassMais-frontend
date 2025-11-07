import { NextResponse } from "next/server";

import { addJoinCodeToStore } from "../../doctor/team/mock-data";

type InvitePayload = {
    maxUses?: number;
    expiresAt?: string;
    secretaryFullName?: string;
    secretaryCorporateEmail?: string;
};

const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function generateInviteCode(): string {
    const segments: string[] = [];
    const segmentLength = 4;
    for (let s = 0; s < 3; s += 1) {
        let segment = "";
        for (let i = 0; i < segmentLength; i += 1) {
            const index = Math.floor(Math.random() * CODE_ALPHABET.length);
            segment += CODE_ALPHABET[index];
        }
        segments.push(segment);
    }
    return segments.join("-");
}

export async function POST(request: Request) {
    let payload: InvitePayload = {};
    try {
        payload = (await request.json()) as InvitePayload;
    } catch {
        // payload permanece vazio para validação abaixo
    }

    const fullName = payload.secretaryFullName?.trim();
    const email = payload.secretaryCorporateEmail?.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!fullName || !email) {
        return NextResponse.json(
            { message: "Informe o nome completo e o e-mail corporativo da secretária." },
            { status: 400 },
        );
    }

    if (!emailRegex.test(email)) {
        return NextResponse.json({ message: "E-mail corporativo inválido. Confira o endereço digitado." }, { status: 400 });
    }

    const uses = Math.max(
        1,
        Number.isFinite(Number(payload.maxUses)) && Number(payload.maxUses) > 0 ? Math.floor(Number(payload.maxUses)) : 1,
    );

    const expiresAt = (() => {
        if (!payload.expiresAt) {
            return new Date(Date.now() + 3 * 60 * 60 * 1000);
        }
        const parsed = new Date(payload.expiresAt);
        if (Number.isNaN(parsed.getTime())) {
            return new Date(Date.now() + 3 * 60 * 60 * 1000);
        }
        return parsed;
    })();

    const inviteId = `invite-${Date.now()}`;
    const code = generateInviteCode();
    const expiresIso = expiresAt.toISOString();

    addJoinCodeToStore({
        id: inviteId,
        code,
        expiresAt: expiresIso,
        usesLeft: uses,
        status: "ativo",
        secretaryName: fullName,
        secretaryEmail: email,
    });

    return NextResponse.json({
        inviteId,
        code,
        status: "ACTIVE",
        usesRemaining: uses,
        expiresAt: expiresIso,
        secretaryFullName: fullName,
        secretaryCorporateEmail: email,
    });
}
