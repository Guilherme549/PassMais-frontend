import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

// Interface para o médico
interface Doctor {
    id: number;
    name: string;
    specialty: string;
    address: string;
    consultationFee: number;
}

// Usar uma tipagem genérica para evitar o erro com PageProps
export default async function Confirmation({ searchParams }: any) {
    const session = await getServerSession();
    if (!session) redirect("/");

    const { doctorId, date, time, forWhom, paymentMethod } = searchParams;

    if (!doctorId || !date || !time || !forWhom || !paymentMethod) {
        redirect("/medical-appointments");
    }

    // Dados fictícios do médico (em um cenário real, isso viria de um banco de dados)
    const doctors: Doctor[] = [
        {
            id: 1,
            name: "Dr. Nome do Médico",
            specialty: "Cirurgião geral",
            address: "R. Ana Luiza Souza, Qd. 24 - Lt. 288 - Jundiaí, Anápolis - GO, 75110-030",
            consultationFee: 300,
        },
        {
            id: 2,
            name: "Dr. João Silva",
            specialty: "Cardiologista",
            address: "Av. Brasil, 100 - Centro, Goiânia - GO, 74000-000",
            consultationFee: 350,
        },
        {
            id: 3,
            name: "Dra. Maria Oliveira",
            specialty: "Dermatologista",
            address: "Rua 10, 500 - Setor Oeste, Goiânia - GO, 74120-020",
            consultationFee: 400,
        },
    ];

    const doctor = doctors.find((doc) => doc.id === parseInt(doctorId));

    if (!doctor) redirect("/medical-appointments");

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center">
            <div className="bg-white shadow-xl rounded-2xl p-8 max-w-2xl w-full">
                <h1 className="text-3xl font-bold text-gray-900 mb-6 text-center">
                    Consulta Agendada com Sucesso!
                </h1>
                <div className="space-y-4">
                    <p className="text-lg text-gray-700">
                        <span className="font-semibold">Médico:</span> {doctor.name} ({doctor.specialty})
                    </p>
                    <p className="text-lg text-gray-700">
                        <span className="font-semibold">Data:</span> {date}
                    </p>
                    <p className="text-lg text-gray-700">
                        <span className="font-semibold">Horário:</span> {time}
                    </p>
                    <p className="text-lg text-gray-700">
                        <span className="font-semibold">Para:</span> {forWhom}
                    </p>
                    <p className="text-lg text-gray-700">
                        <span className="font-semibold">Método de Pagamento:</span> {paymentMethod}
                    </p>
                    <p className="text-lg text-gray-700">
                        <span className="font-semibold">Endereço:</span> {doctor.address}
                    </p>
                    <p className="text-lg text-gray-700">
                        <span className="font-semibold">Valor da Consulta:</span> R${doctor.consultationFee},00
                    </p>
                </div>
                <div className="mt-8 text-center">
                    <a
                        href="/medical-appointments"
                        className="bg-[#5179EF] text-white font-medium px-6 py-3 rounded-lg hover:bg-blue-700 transition-all duration-200"
                    >
                        Voltar para Lista de Médicos
                    </a>
                </div>
            </div>
        </div>
    );
}