import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import ClientDoctorProfile from "./components/ClientDoctorProfile";

// Definir a interface do médico
interface Doctor {
    id: number;
    name: string;
    specialty: string;
    crm: string;
    rating: number;
    reviewsCount: number;
    address: string;
    bio: string;
    consultationFee: number;
    availableSlots: { date: string; times: string[] }[];
}

// Usar uma tipagem genérica para evitar o erro com PageProps
export default async function DoctorProfile({ params }: any) {
    const session = await getServerSession();

    if (!session) {
        redirect("/");
    }

    // Dados fictícios do médico (em um cenário real, isso viria de um banco de dados)
    const doctors: Doctor[] = [
        {
            id: 1,
            name: "Dr. Nome do Médico",
            specialty: "Cirurgião geral",
            crm: "00/0000",
            rating: 4.5,
            reviewsCount: 127,
            address: "R. Ana Luiza Souza, Qd. 24 - Lt. 288 - Jundiaí, Anápolis - GO, 75110-030",
            bio: "Médico cirurgião geral com mais de 15 anos de experiência, especializado em cirurgias minimamente invasivas e atendimento humanizado.",
            consultationFee: 300,
            availableSlots: [
                { date: "2025-05-26", times: ["09:00", "10:00", "11:00"] },
                { date: "2025-05-27", times: ["14:00", "15:00", "16:00"] },
                { date: "2025-05-28", times: ["09:00", "10:00"] },
            ],
        },
        {
            id: 2,
            name: "Dr. João Silva",
            specialty: "Cardiologista",
            crm: "01/1111",
            rating: 4.7,
            reviewsCount: 95,
            address: "Av. Brasil, 100 - Centro, Goiânia - GO, 74000-000",
            bio: "Cardiologista renomado com foco em prevenção e tratamento de doenças cardiovasculares, com mais de 10 anos de experiência.",
            consultationFee: 350,
            availableSlots: [
                { date: "2025-05-26", times: ["13:00", "14:00", "15:00"] },
                { date: "2025-05-27", times: ["09:00", "10:00"] },
                { date: "2025-05-28", times: ["16:00", "17:00"] },
            ],
        },
        {
            id: 3,
            name: "Dra. Maria Oliveira",
            specialty: "Dermatologista",
            crm: "02/2222",
            rating: 4.8,
            reviewsCount: 150,
            address: "Rua 10, 500 - Setor Oeste, Goiânia - GO, 74120-020",
            bio: "Dermatologista especializada em tratamentos estéticos e clínicos, com ampla experiência em doenças de pele e rejuvenescimento.",
            consultationFee: 400,
            availableSlots: [
                { date: "2025-05-26", times: ["10:00", "11:00"] },
                { date: "2025-05-27", times: ["14:00", "15:00", "16:00"] },
                { date: "2025-05-28", times: ["09:00", "10:00", "11:00"] },
            ],
        },
    ];

    // Acessar params.id de forma explícita
    const doctorId = parseInt(params.id);
    const doctor = doctors.find((doc) => doc.id === doctorId);

    if (!doctor) {
        redirect("/medical-appointments");
    }

    return <ClientDoctorProfile doctor={doctor} />;
}