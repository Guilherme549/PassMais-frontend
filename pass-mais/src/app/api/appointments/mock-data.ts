export type AppointmentStatus =
    | "agendada"
    | "confirmada"
    | "em-andamento"
    | "concluida"
    | "cancelada";

export type PatientRecord = {
    id: string;
    name: string;
    cpf: string;
    birthDate?: string | null;
    motherName?: string | null;
    sex?: "Feminino" | "Masculino" | "Outro" | "Não informado" | null;
    email?: string | null;
    address?: string | null;
    updatedAt?: string | null;
};

export type AppointmentRecord = {
    id: string;
    doctorId: string;
    doctorName: string;
    scheduledAt: string;
    location: string;
    status: AppointmentStatus;
    checkInAt: string | null;
    patient: PatientRecord;
};

let appointmentsStore: AppointmentRecord[] = [
    {
        id: "apt-sec-001",
        doctorId: "doc-carlos",
        doctorName: "Dr. Carlos Mendes",
        scheduledAt: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
        location: "Clínica Vida Plena - Sala 3",
        status: "agendada",
        checkInAt: null,
        patient: {
            id: "pat-secretaria-001",
            name: "Ana Oliveira",
            cpf: "12345678901",
            birthDate: "1988-02-20",
            motherName: "Maria da Silva",
            sex: "Feminino",
            email: "ana.oliveira@example.com",
            address: "Rua das Flores, 123 - São Paulo/SP",
            updatedAt: "2024-02-18T12:00:00-03:00",
        },
    },
    {
        id: "apt-sec-002",
        doctorId: "doc-joana",
        doctorName: "Dra. Joana Prado",
        scheduledAt: new Date(Date.now() + 3 * 60 * 60 * 1000).toISOString(),
        location: "Consultório Prado - Sala 2",
        status: "agendada",
        checkInAt: null,
        patient: {
            id: "pat-secretaria-002",
            name: "Carlos Souza",
            cpf: "98765432100",
            birthDate: "1975-10-05",
            motherName: "Rita Souza",
            sex: "Masculino",
            email: "carlos.souza@example.com",
            address: "Av. Central, 450 - Campinas/SP",
            updatedAt: null,
        },
    },
    {
        id: "apt-sec-003",
        doctorId: "doc-fernando",
        doctorName: "Dr. Fernando Tanaka",
        scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        location: "Hospital São Lucas - Sala 5",
        status: "confirmada",
        checkInAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        patient: {
            id: "pat-secretaria-003",
            name: "Beatriz Mendes",
            cpf: "11223344556",
            birthDate: "1992-04-14",
            motherName: "Helena Mendes",
            sex: "Feminino",
            email: "beatriz.mendes@example.com",
            address: "Rua Nova, 210 - São Paulo/SP",
            updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        },
    },
];

export function getAppointmentsSnapshot(): AppointmentRecord[] {
    return appointmentsStore.map((appointment) => ({ ...appointment, patient: { ...appointment.patient } }));
}

function normalizeName(value: string) {
    return value
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\s+/g, " ")
        .trim()
        .toLowerCase();
}

function normalizeCpf(value: string) {
    return value.replace(/\D/g, "");
}

type ConfirmPayload = {
    fullName: string;
    cpf: string;
    birthDate: string;
    motherName: string;
    sex: PatientRecord["sex"];
    email?: string | null;
    address: string;
};

export function confirmAppointmentPresence(appointmentId: string, payload: ConfirmPayload): AppointmentRecord {
    const appointment = appointmentsStore.find((item) => item.id === appointmentId);
    if (!appointment) {
        throw new Error("Agendamento não encontrado");
    }

    const normalizedProvidedName = normalizeName(payload.fullName);
    const normalizedStoredName = normalizeName(appointment.patient.name);
    const matchName = normalizedProvidedName === normalizedStoredName;

    const normalizedProvidedCpf = normalizeCpf(payload.cpf);
    const normalizedStoredCpf = normalizeCpf(appointment.patient.cpf);
    const matchCpf = normalizedProvidedCpf === normalizedStoredCpf;

    if (!matchName || !matchCpf) {
        throw new Error(
            "Nome completo ou CPF não conferem com os dados do agendamento. Verifique e tente novamente.",
        );
    }

    const nowIso = new Date().toISOString();

    appointment.status = "confirmada";
    appointment.checkInAt = nowIso;
    appointment.patient = {
        ...appointment.patient,
        name: payload.fullName.trim(),
        cpf: normalizedProvidedCpf,
        birthDate: payload.birthDate || null,
        motherName: payload.motherName.trim(),
        sex: payload.sex ?? "Não informado",
        email: payload.email?.trim() || null,
        address: payload.address.trim(),
        updatedAt: nowIso,
    };

    return { ...appointment, patient: { ...appointment.patient } };
}
