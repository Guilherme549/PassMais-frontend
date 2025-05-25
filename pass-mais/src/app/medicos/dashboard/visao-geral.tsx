"use client";

interface VisaoGeralProps {
    appointments: { id: number; patient: string; date: string; time: string; status: string }[];
}

export default function VisaoGeral({ appointments }: VisaoGeralProps) {
    const today = "2025-05-25";
    const todaysAppointments = appointments.filter((appt) => appt.date === today);

    return (
        <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Visão Geral</h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                <div className="bg-white shadow-lg rounded-lg p-6 text-center">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Consultas Hoje</h3>
                    <p className="text-3xl font-bold text-[#5179EF]">{todaysAppointments.length}</p>
                </div>
                <div className="bg-white shadow-lg rounded-lg p-6 text-center">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Pendentes</h3>
                    <p className="text-3xl font-bold text-[#5179EF]">
                        {todaysAppointments.filter((appt) => appt.status === "pendente").length}
                    </p>
                </div>
                <div className="bg-white shadow-lg rounded-lg p-6 text-center">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Realizadas</h3>
                    <p className="text-3xl font-bold text-[#5179EF]">
                        {todaysAppointments.filter((appt) => appt.status === "realizada").length}
                    </p>
                </div>
                <div className="bg-white shadow-lg rounded-lg p-6 text-center">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Canceladas</h3>
                    <p className="text-3xl font-bold text-[#5179EF]">
                        {todaysAppointments.filter((appt) => appt.status === "cancelada").length}
                    </p>
                </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white shadow-lg rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Últimos Atendimentos</h3>
                    <ul className="space-y-2">
                        {appointments
                            .filter((appt) => appt.status === "realizada")
                            .slice(0, 2)
                            .map((appt) => (
                                <li key={appt.id} className="text-gray-600">
                                    {appt.patient} - {appt.date} às {appt.time}
                                </li>
                            ))}
                    </ul>
                </div>
                <div className="bg-white shadow-lg rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Próximos Horários</h3>
                    <ul className="space-y-2">
                        {appointments
                            .filter((appt) => appt.status === "pendente")
                            .slice(0, 2)
                            .map((appt) => (
                                <li key={appt.id} className="text-gray-600">
                                    {appt.patient} - {appt.date} às {appt.time}
                                </li>
                            ))}
                    </ul>
                </div>
            </div>
        </section>
    );
}