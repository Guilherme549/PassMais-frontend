import type { Doctor as DoctorSummary } from "@/app/medical-appointments/types";
import { fallbackDoctors } from "@/app/medical-appointments/fallbackDoctors";
import { normalizeImageUrl } from "@/lib/utils";

export interface DoctorProfile extends DoctorSummary {
    consultationFee?: number | null;
}

export function buildDoctorProfile(base: DoctorSummary): DoctorProfile {
    return {
        ...base,
        bio: base.bio || "Biografia não informada.",
        address: base.address ?? "Endereço não informado.",
        consultationFee: deriveConsultationFee(base.id),
    };
}

export function normalizeDoctors(data: unknown[]): DoctorSummary[] {
    const normalized: DoctorSummary[] = [];

    for (const item of data) {
        const raw = item as Record<string, unknown>;
        const id = raw?.id != null ? String(raw.id) : "";
        if (!id) continue;

        normalized.push({
            id,
            name: typeof raw.name === "string" ? raw.name : "Nome não informado",
            specialty: typeof raw.specialty === "string" ? raw.specialty : "Especialidade não informada",
            crm: typeof raw.crm === "string" ? raw.crm : "CRM não informado",
            bio: typeof raw.bio === "string" ? raw.bio : "",
            averageRating: typeof raw.averageRating === "number" ? raw.averageRating : 0,
            reviewsCount: typeof raw.reviewsCount === "number" ? raw.reviewsCount : 0,
            photo: normalizeImageUrl(raw.photoUrl),
            clinicName:
                typeof raw.clinicName === "string" && raw.clinicName.trim().length > 0
                    ? raw.clinicName
                    : null,
            clinicStreetAndNumber:
                typeof raw.clinicStreetAndNumber === "string" && raw.clinicStreetAndNumber.trim().length > 0
                    ? raw.clinicStreetAndNumber
                    : null,
            clinicCity:
                typeof raw.clinicCity === "string" && raw.clinicCity.trim().length > 0
                    ? raw.clinicCity
                    : null,
            clinicPostalCode:
                typeof raw.clinicPostalCode === "string" && raw.clinicPostalCode.trim().length > 0
                    ? raw.clinicPostalCode
                    : null,
            consultationPrice:
                typeof raw.consultationPrice === "number" ? raw.consultationPrice : null,
            address: (() => {
                const legacy =
                    typeof raw.address === "string" && raw.address.trim().length > 0
                        ? raw.address
                        : null;
                if (legacy) return legacy;

                const composedAddress = [
                    typeof raw.clinicStreetAndNumber === "string"
                        ? raw.clinicStreetAndNumber.trim()
                        : "",
                    typeof raw.clinicCity === "string" ? raw.clinicCity.trim() : "",
                    typeof raw.clinicPostalCode === "string" ? raw.clinicPostalCode.trim() : "",
                ]
                    .filter((value) => value.length > 0)
                    .join(", ");

                const composed = [
                    typeof raw.clinicName === "string" ? raw.clinicName.trim() : "",
                    composedAddress,
                ]
                    .filter((value) => value.length > 0)
                    .join(" - ");

                return composed.length > 0 ? composed : null;
            })(),
        } satisfies DoctorSummary);
    }

    return normalized;
}

export function applyFallbackDoctor(
    doctorId: string,
    isMounted: boolean,
    setDoctor: (doctor: DoctorProfile) => void,
    loadSchedule: (doctorId: string, force?: boolean) => void
): boolean {
    const fallback = fallbackDoctors.find((doc) => doc.id === doctorId);
    if (!fallback) return false;
    if (isMounted) {
        setDoctor(buildDoctorProfile(fallback));
        loadSchedule(fallback.id, true);
    }
    return true;
}

function deriveConsultationFee(id: string): number {
    const hash = Array.from(id).reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const baseFee = 200;
    const variation = (hash % 6) * 20;
    return baseFee + variation;
}
