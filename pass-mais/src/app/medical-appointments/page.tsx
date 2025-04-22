import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

export default async function MedicalAppointments() {
    const session = await getServerSession();

    if (!session) {
        redirect("/");
    }

    return (
        <div className="flex">
            <div className="w-[33.75rem] mx-auto ">
                <h1>Olá, {session?.user?.name}</h1>
                <div className="w-[22.5rem] mx-auto m-[100px]">
                    <h2 className="text-2xl font-semibold mb-[24px] text-center">Agendamentos médicos</h2>
                    <p className="text-center mb-[24px]">Aqui você pode visualizar e gerenciar seus agendamentos médicos.</p>
                </div>
            </div>
        </div>
    );
}
