"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

interface RescheduleAppointmentContentProps {
    target: string;
}

export default function RescheduleAppointmentContent({ target }: RescheduleAppointmentContentProps) {
    const router = useRouter();

    useEffect(() => {
        router.replace(target);
    }, [router, target]);

    return null;
}
