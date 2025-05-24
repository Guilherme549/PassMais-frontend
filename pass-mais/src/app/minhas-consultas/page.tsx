import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import ClientMyAppointments from "./components/ClientMyAppointments";

interface Appointment {
    id: number;
    date: string; // Formato: "DD/MM/YYYY"
    time: string; // Formato: "HH:MM"
    doctor: string;
    address: string;
    value: number; // Em reais
    status: "agendada" | "realizada"; // Status da consulta
}

export default async function MyAppointments() {
    const session = await getServerSession();

    if (!session) {
        redirect("/");
    }

    const appointments: Appointment[] = [
        {
            id: 1,
            date: "25/05/2025",
            time: "14:00",
            doctor: "Dr. Nome do Médico",
            address: "R. Ana Luiza Souza, Qd. 24 - Lt. 288 - Jundiaí, Anápolis - GO, 75110-030",
            value: 250.00,
            status: "agendada",
        },
        {
            id: 2,
            date: "20/05/2025",
            time: "10:30",
            doctor: "Dr. João Silva",
            address: "Av. Brasil, 100 - Centro, Goiânia - GO, 74000-000",
            value: 300.00,
            status: "realizada",
        },
        {
            id: 3,
            date: "18/05/2025",
            time: "09:00",
            doctor: "Dra. Maria Oliveira",
            address: "Rua 10, 500 - Setor Oeste, Goiânia - GO, 74120-020",
            value: 200.00,
            status: "realizada",
        },
    ];

    return <ClientMyAppointments appointments={appointments} />;
}