import { NextResponse } from "next/server";

import { confirmAppointmentPresence } from "../../mock-data";

export async function POST(request: Request, context: { params: { id: string } }) {
    const id = context?.params?.id;

    if (!id) {
        return NextResponse.json({ message: "Agendamento inválido." }, { status: 400 });
    }

    let body: unknown;
    try {
        body = await request.json();
    } catch {
        return NextResponse.json({ message: "Não foi possível ler os dados enviados." }, { status: 400 });
    }

    if (!body || typeof body !== "object") {
        return NextResponse.json({ message: "Dados inválidos para confirmação." }, { status: 400 });
    }

    const payload = body as {
        fullName?: string;
        cpf?: string;
        birthDate?: string;
        motherName?: string;
        sex?: "Feminino" | "Masculino" | "Outro" | "Não informado";
        email?: string | null;
        address?: string;
    };

    if (!payload.fullName || !payload.cpf) {
        return NextResponse.json(
            { message: "Informe nome completo e CPF para confirmar a presença." },
            { status: 400 },
        );
    }

    if (!payload.birthDate || !payload.motherName || !payload.sex || !payload.address) {
        return NextResponse.json(
            { message: "Preencha os campos obrigatórios da ficha do paciente." },
            { status: 400 },
        );
    }

    try {
        const updated = confirmAppointmentPresence(id, {
            fullName: payload.fullName,
            cpf: payload.cpf,
            birthDate: payload.birthDate,
            motherName: payload.motherName,
            sex: payload.sex,
            email: payload.email ?? null,
            address: payload.address,
        });

        return NextResponse.json(updated, { status: 200 });
    } catch (error) {
        const message = error instanceof Error ? error.message : "Não foi possível confirmar o atendimento.";
        return NextResponse.json({ message }, { status: 400 });
    }
}
