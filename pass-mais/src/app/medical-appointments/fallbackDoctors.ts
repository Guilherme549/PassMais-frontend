import type { Doctor } from "./types";

export const fallbackDoctors: Doctor[] = [
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
        name: "Dr. João Silva",
        specialty: "Cardiologista",
        crm: "01/1111",
        bio: "Cardiologista com experiência em prevenção e tratamento de doenças cardiovasculares, atuando com tecnologia de ponta.",
        averageRating: 4.7,
        reviewsCount: 95,
        photo: "/doctor.png",
        address: "Av. Brasil, 100 - Centro, Goiânia - GO, 74000-000",
    },
    {
        id: "3",
        name: "Dra. Maria Oliveira",
        specialty: "Dermatologista",
        crm: "02/2222",
        bio: "Dermatologista dedicada a tratamentos estéticos e clínicos, com foco em resultados personalizados e cuidados contínuos.",
        averageRating: 4.8,
        reviewsCount: 150,
        photo: "/doctor.png",
        address: "Rua 10, 500 - Setor Oeste, Goiânia - GO, 74120-020",
    },
];
