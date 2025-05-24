import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import ClientPayment from "./components/ClientPayment";

export default async function Payment({ searchParams }: { searchParams: { [key: string]: string } }) {
    const session = await getServerSession();

    if (!session) {
        redirect("/");
    }

    const { doctorId, date, time, forWhom } = searchParams;

    if (!doctorId || !date || !time || !forWhom) {
        redirect("/medical-appointments");
    }

    return <ClientPayment doctorId={doctorId} date={date} time={time} forWhom={forWhom} />;
}