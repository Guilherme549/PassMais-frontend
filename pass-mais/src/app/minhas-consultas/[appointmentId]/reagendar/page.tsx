import { redirect } from "next/navigation";
import RescheduleAppointmentContent from "./RescheduleAppointmentContent";

interface PageProps {
    params: Promise<{ appointmentId: string }>;
    searchParams?: Promise<Record<string, string | string[] | undefined>>;
}

export default async function LegacyReschedulePage({ params, searchParams }: PageProps) {
    const resolvedParams = await params;
    const resolvedSearch = (await searchParams) ?? {};
    const appointmentId = resolvedParams?.appointmentId?.trim();

    if (!appointmentId) {
        redirect("/minhas-consultas");
    }

    const query = new URLSearchParams();
    for (const [key, value] of Object.entries(resolvedSearch)) {
        if (typeof value === "string") {
            query.set(key, value);
        } else if (Array.isArray(value) && value.length > 0) {
            query.set(key, value[0]);
        }
    }

    const target =
        query.size > 0
            ? `/reagendar-consulta/${encodeURIComponent(appointmentId)}?${query.toString()}`
            : `/reagendar-consulta/${encodeURIComponent(appointmentId)}`;

    return <RescheduleAppointmentContent target={target} />;
}
