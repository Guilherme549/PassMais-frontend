export type AppointmentStatus = "AGENDADA" | "REALIZADA" | "CANCELADA" | string;

export type PatientAppointmentsApiItem = Record<string, unknown>;

export type Appointment = {
    id: string;
    date: string;
    time: string;
    appointmentDateTime?: string | null;
    doctorId?: string | null;
    doctorName: string;
    patientId?: string | null;
    patientName: string;
    patientCpf?: string | null;
    patientBirthDate?: string | null;
    patientPhone?: string | null;
    clinicAddress: string;
    location?: string | null;
    price: number;
    status: AppointmentStatus;
    consultationValue?: number | null;
    bookedAt?: string | null;
    reason?: string | null;
    timezone?: string | null;
};

const STATUS_PATHS = ["status", "appointmentStatus", "situation", "state", "currentStatus"];
const DOCTOR_ID_PATHS = [
    "doctorId",
    "doctor_id",
    "doctor.id",
    "doctor.doctorId",
    "doctor.externalId",
    "doctor.externalID",
    "medico.id",
    "medico.doctorId",
    "professional.id",
    "professionalId",
    "schedule.doctorId",
];
const DOCTOR_NAME_PATHS = ["doctorName", "doctor.name", "medico.nome", "professional.name", "provider.name"];
const PATIENT_ID_PATHS = [
    "patientId",
    "patient_id",
    "patient.id",
    "patient.patientId",
    "patient.externalId",
    "patient.userId",
    "paciente.id",
];
const PATIENT_NAME_PATHS = [
    "patientName",
    "patient.name",
    "paciente.nome",
    "patient.fullName",
    "patient.full_name",
];
const PATIENT_CPF_PATHS = [
    "patientCpf",
    "patient.cpf",
    "patient.document",
    "patient.documentNumber",
    "paciente.cpf",
    "cpf",
    "document",
];
const PATIENT_BIRTH_DATE_PATHS = ["patientBirthDate", "patient.birthDate", "paciente.dataNascimento", "birthDate"];
const PATIENT_PHONE_PATHS = [
    "patientCellPhone",
    "patient.phone",
    "patient.cellPhone",
    "paciente.telefone",
    "phone",
    "cellPhone",
];
const DATE_PATHS = ["date", "appointmentDate", "scheduledDate", "day", "appointment.date"];
const TIME_PATHS = ["time", "appointmentTime", "hour", "slot.time"];
const DATETIME_PATHS = ["dateTime", "appointmentDateTime", "scheduledAt", "startAt"];
const CLINIC_ADDRESS_PATHS = [
    "clinicAddress",
    "location",
    "consultingRoom",
    "clinic.fullAddress",
    "clinic.address",
];
const LOCATION_PATHS = ["location", "clinicAddress", "clinic.location"];
const PRICE_PATHS = ["price", "value", "consultationValue", "amount"];
const REASON_PATHS = ["reason", "appointmentReason", "motivo", "notes"];
const TIMEZONE_PATHS = ["timezone", "timeZone", "tz"];

function getNestedValue(source: unknown, path: string): unknown {
    if (!source || typeof source !== "object") return undefined;
    const segments = path.split(".");
    let current: unknown = source;
    for (const segment of segments) {
        if (!current || typeof current !== "object") return undefined;
        current = (current as Record<string, unknown>)[segment];
    }
    return current;
}

function pickFirstString(record: PatientAppointmentsApiItem, paths: string[]) {
    for (const path of paths) {
        const value = getNestedValue(record, path);
        if (typeof value === "string" && value.trim().length > 0) {
            return value.trim();
        }
    }
    return null;
}

function pickFirstNumber(record: PatientAppointmentsApiItem, paths: string[]) {
    for (const path of paths) {
        const value = getNestedValue(record, path);
        if (typeof value === "number" && Number.isFinite(value)) {
            return value;
        }
        if (typeof value === "string") {
            const normalized = value.replace(",", ".").trim();
            const parsed = Number(normalized);
            if (Number.isFinite(parsed)) {
                return parsed;
            }
        }
    }
    return null;
}

function pickDigits(record: PatientAppointmentsApiItem, paths: string[]) {
    for (const path of paths) {
        const value = getNestedValue(record, path);
        if (typeof value === "string" && value.trim().length > 0) {
            const digits = value.replace(/\D/g, "");
            if (digits.length > 0) return digits;
        }
    }
    return null;
}

export function extractAppointmentsPayload(payload: unknown): PatientAppointmentsApiItem[] {
    if (Array.isArray(payload)) {
        return payload.filter((item): item is PatientAppointmentsApiItem => Boolean(item));
    }

    if (payload && typeof payload === "object") {
        const source = payload as Record<string, unknown>;
        const candidates = [source.data, source.items, source.results, source.appointments, source.content];
        for (const candidate of candidates) {
            if (Array.isArray(candidate)) {
                return candidate.filter((item): item is PatientAppointmentsApiItem => Boolean(item));
            }
        }
    }

    return [];
}

export function normalizeStatus(value?: string | null): AppointmentStatus {
    if (!value) return "AGENDADA";
    const upper = value.toUpperCase();
    if (["AGENDADA", "AGENDADO", "SCHEDULED", "PENDING", "CONFIRMADA", "CONFIRMADO"].includes(upper)) {
        return "AGENDADA";
    }
    if (["REALIZADA", "REALIZADO", "COMPLETED", "DONE"].includes(upper)) {
        return "REALIZADA";
    }
    if (["CANCELADA", "CANCELADO", "CANCELED", "CANCELLED"].includes(upper)) {
        return "CANCELADA";
    }
    return upper as AppointmentStatus;
}

export function normalizeAppointments(data: PatientAppointmentsApiItem[]): Appointment[] {
    if (!Array.isArray(data) || data.length === 0) return [];
    return data.map((item, index) => {
        const idValue = item?.id ?? item?.appointmentId ?? null;
        const normalizedId = idValue != null ? String(idValue) : `appt-${index + 1}`;

        const date = pickFirstString(item, DATE_PATHS) ?? "—";
        const time = pickFirstString(item, TIME_PATHS) ?? "—";
        const appointmentDateTime = pickFirstString(item, DATETIME_PATHS);
        const doctorId = pickFirstString(item, DOCTOR_ID_PATHS);
        const doctorName = pickFirstString(item, DOCTOR_NAME_PATHS) ?? "—";
        const patientId = pickFirstString(item, PATIENT_ID_PATHS);
        const patientName = pickFirstString(item, PATIENT_NAME_PATHS) ?? "—";
        const patientCpf = pickDigits(item, PATIENT_CPF_PATHS);
        const patientBirthDate = pickFirstString(item, PATIENT_BIRTH_DATE_PATHS);
        const patientPhone = pickDigits(item, PATIENT_PHONE_PATHS);
        const resolvedClinicAddress =
            pickFirstString(item, CLINIC_ADDRESS_PATHS) ??
            [pickFirstString(item, ["clinic.name"]), pickFirstString(item, ["clinic.city"])]
                .filter(Boolean)
                .join(" - ");
        const clinicAddress = resolvedClinicAddress && resolvedClinicAddress.length > 0 ? resolvedClinicAddress : "—";
        const location = pickFirstString(item, LOCATION_PATHS);
        const price = pickFirstNumber(item, PRICE_PATHS);
        const reason = pickFirstString(item, REASON_PATHS);
        const timezone = pickFirstString(item, TIMEZONE_PATHS);
        const bookedAt = pickFirstString(item, ["bookedAt", "createdAt"]);

        return {
            id: normalizedId,
            date,
            time,
            appointmentDateTime,
            doctorId,
            doctorName,
            patientId,
            patientName,
            patientCpf,
            patientBirthDate,
            patientPhone,
            clinicAddress,
            location,
            price: Number.isFinite(price) && price != null ? Number(price) : 0,
            status: normalizeStatus(pickFirstString(item, STATUS_PATHS)),
            consultationValue: price ?? null,
            bookedAt,
            reason,
            timezone,
        };
    });
}
