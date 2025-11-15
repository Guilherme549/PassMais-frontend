import { Suspense } from "react";
import RescheduleConsultationPage from "./RescheduleConsultationPage";

interface PageProps {
    params: Promise<{ appointmentId: string }>;
}

export default async function ReagendarConsultaPage({ params }: PageProps) {
    const resolvedParams = await params;
    const appointmentId = resolvedParams?.appointmentId ?? "";

    return (
        <Suspense fallback={null}>
            <RescheduleConsultationPage appointmentId={appointmentId} />
        </Suspense>
    );
}
