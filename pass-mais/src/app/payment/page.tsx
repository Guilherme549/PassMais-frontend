import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import ClientPayment from "./components/ClientPayment";

// Usar uma tipagem genérica para evitar o erro com PageProps
export default async function Payment({ searchParams }: any) {
    const session = await getServerSession();
    if (!session) redirect("/");

    const { doctorId, date, time, forWhom } = searchParams;

    if (!doctorId || !date || !time || !forWhom) redirect("/medical-appointments");

    return (
        <ClientPayment
            doctorId={doctorId}
            date={date}
            time={time}
            forWhom={forWhom}
        />
    );
}