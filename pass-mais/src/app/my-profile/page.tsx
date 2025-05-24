import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import ClientProfile from "./components/ClientProfile";

interface UserProfile {
    name: string;
    gender: string;
    birthDate: string;
    nickname: string;
    maritalStatus: string;
    address: {
        street: string;
        cep: string;
        neighborhood: string;
        state: string;
    };
    documents: {
        cpf: string;
        rg: string;
    };
    contact: {
        email: string;
        phone: string;
        communicationPreference: string;
    };
}

export default async function MyProfile() {
    const session = await getServerSession();

    if (!session) {
        redirect("/");
    }

    const userProfile: UserProfile = {
        name: "Guilherme",
        gender: "Masculino",
        birthDate: "12/12/1234",
        nickname: "editar para adicionar",
        maritalStatus: "editar para adicionar",
        address: {
            street: "editar para adicionar",
            cep: "editar para adicionar",
            neighborhood: "editar para adicionar",
            state: "editar para adicionar",
        },
        documents: {
            cpf: "12345678978",
            rg: "não disponível",
        },
        contact: {
            email: "guilherme@gmail.com",
            phone: "(62)985247896",
            communicationPreference: "editar para adicionar",
        },
    };

    return <ClientProfile userProfile={userProfile} />;
}