"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function MedicoDashboard() {
    const router = useRouter();

    useEffect(() => {
        router.push("/medicos/dashboard/visao-geral"); // Redireciona para a seção padrão
    }, [router]);

    return null; // Não renderiza nada, apenas redireciona
}