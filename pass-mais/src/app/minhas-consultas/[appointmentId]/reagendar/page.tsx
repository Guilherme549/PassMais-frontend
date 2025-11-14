import { Suspense } from "react";
import RescheduleAppointmentContent from "./RescheduleAppointmentContent";

export default function AppointmentReschedulePage() {
    return (
        <Suspense fallback={null}>
            <RescheduleAppointmentContent />
        </Suspense>
    );
}
