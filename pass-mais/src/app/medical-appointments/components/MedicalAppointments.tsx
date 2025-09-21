import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import ClientMedicalAppointments from "./ClientMedicalAppointments";
import type { Doctor } from "../types";

export default async function MedicalAppointments() {
    const session = await getServerSession();

    if (!session) {
        redirect("/");
    }

    const doctors: Doctor[] = [
        {
            id: "1",
            name: "Dr. Nome do Médico",
            specialty: "Cirurgião geral",
            crm: "00/0000",
            bio: "Profissional especializado em cirurgias minimamente invasivas, com foco em atendimento humanizado e seguro.",
            averageRating: 4.5,
            reviewsCount: 127,
            photo: "/doctor.png",
            address: "R. Ana Luiza Souza, Qd. 24 - Lt. 288 - Jundiaí, Anápolis - GO, 75110-030",
        },
        {
            id: "2",
            name: "Dr. Nome do Médico",
            specialty: "Cirurgião geral",
            crm: "00/0000",
            bio: "Cardiologista com experiência em prevenção e tratamento de doenças cardiovasculares, atuando com tecnologia de ponta.",
            averageRating: 4.6,
            reviewsCount: 98,
            photo: "/doctor.png",
            address: "Av. Brasil, 100 - Centro, Goiânia - GO, 74000-000",
        },
    ];

    return <ClientMedicalAppointments doctors={doctors} />;
}
