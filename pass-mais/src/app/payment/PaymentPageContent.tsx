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

    useEffect(() => {
        const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") : null;

        if (!token) {
            router.replace(`/login?redirect=${encodeURIComponent(currentPath)}`);
            return;
        }

        if (!doctorId || !date || !time || !forWhom) {
            router.replace("/medical-appointments");
            return;
        }

        setIsReady(true);
    }, [router, currentPath, doctorId, date, time, forWhom]);

    if (!isReady || !doctorId || !date || !time || !forWhom) {
        return null;
    }

    return (
        <ClientPayment
            doctorId={doctorId}
            date={date}
            time={time}
            forWhom={forWhom}
        />
    );
}
