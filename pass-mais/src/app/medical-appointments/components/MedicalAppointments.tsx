import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import ClientMedicalAppointments from "./ClientMedicalAppointments";

interface Doctor {
    id: number;
    name: string;
    specialty: string;
    crm: string;
    rating: number;
    reviewsCount: number;
    address: string;
}

export default async function MedicalAppointments() {
    const session = await getServerSession();

    if (!session) {
        redirect("/");
    }

    const doctors: Doctor[] = [
        {
            id: 1,
            name: "Dr. Nome do Médico",
            specialty: "Cirurgião geral",
            crm: "00/0000",
            rating: 4.5,
            reviewsCount: 127,
            address: "R. Ana Luiza Souza, Qd. 24 - Lt. 288 - Jundiaí, Anápolis - GO, 75110-030",
        },
        {
            id: 2,
            name: "Dr. Nome do Médico",
            specialty: "Cirurgião geral",
            crm: "00/0000",
            rating: 4.5,
            reviewsCount: 127,
            address: "R. Ana Luiza Souza, Qd. 24 - Lt. 288 - Jundiaí, Anápolis - GO, 75110-030",
        },
    ];


    return <ClientMedicalAppointments doctors={doctors} />;
}