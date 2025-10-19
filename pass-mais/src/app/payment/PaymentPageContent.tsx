"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import ClientPayment from "./components/ClientPayment";

export default function PaymentPageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [isReady, setIsReady] = useState(false);

    const queryString = searchParams.toString();
    const currentPath = useMemo(() => (
        queryString.length > 0 ? `/payment?${queryString}` : "/payment"
    ), [queryString]);

    const doctorId = searchParams.get("doctorId");
    const date = searchParams.get("date");
    const time = searchParams.get("time");
    const forWhom = searchParams.get("forWhom");
    const timezone = searchParams.get("timezone");
    const reason = searchParams.get("reason");
    const otherPatientName = searchParams.get("otherPatientName");
    const otherPatientCpf = searchParams.get("otherPatientCpf");
    const otherPatientBirthDate = searchParams.get("otherPatientBirthDate");
    const patientName = searchParams.get("patientName");
    const patientCpf = searchParams.get("cpf");
    const patientBirthDate = searchParams.get("birthDate");
    const patientPhone = searchParams.get("phone");
    const otherPatientPhone = searchParams.get("otherPatientPhone");
    const consultationValue = searchParams.get("consultationValue");
    const location = searchParams.get("location");

    useEffect(() => {
        const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;

        if (!token) {
            router.replace(`/login?redirect=${encodeURIComponent(currentPath)}`);
            return;
        }

        if (!doctorId || !date || !time || !forWhom || !timezone) {
            router.replace("/medical-appointments");
            return;
        }

        setIsReady(true);
    }, [router, currentPath, doctorId, date, time, forWhom, timezone]);

    if (!isReady || !doctorId || !date || !time || !forWhom || !timezone) {
        return null;
    }

    return (
        <ClientPayment
            doctorId={doctorId}
            date={date}
            time={time}
            forWhom={forWhom}
            timezone={timezone}
            reason={reason}
            otherPatientName={otherPatientName}
            otherPatientCpf={otherPatientCpf}
            otherPatientBirthDate={otherPatientBirthDate}
            patientName={patientName}
            patientCpf={patientCpf}
            patientBirthDate={patientBirthDate}
            patientPhone={patientPhone}
            otherPatientPhone={otherPatientPhone}
            consultationValue={consultationValue}
            location={location}
        />
    );
}
