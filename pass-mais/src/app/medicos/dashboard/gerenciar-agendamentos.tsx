"use client";

interface GerenciarAgendamentosProps {
    appointments: { id: number; patient: string; date: string; time: string; status: string }[];
}

export default function GerenciarAgendamentos({ appointments }: GerenciarAgendamentosProps) {
    return (
        <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Gerenciar Agendamentos</h2>
            <div className="bg-white shadow-lg rounded-lg p-6">
                <ul className="space-y-4">
                    {appointments.map((appt) => (
                        <li key={appt.id} className="border-b pb-4">
                            <div className="flex justify-between items-center">
                                <div>
                                    <p className="text-gray-900 font-medium">{appt.patient}</p>
                                    <p className="text-gray-600">{appt.date} às {appt.time} - {appt.status}</p>
                                </div>
                                <div className="space-x-2">
                                    <button className="text-[#5179EF] hover:underline">Reagendar</button>
                                    <button className="text-[#5179EF] hover:underline">Cancelar</button>
                                    <button className="text-[#5179EF] hover:underline">Remarcar</button>
                                </div>
                            </div>
                            <div className="mt-4">
                                <label className="block text-sm text-gray-700 mb-2">Observações</label>
                                <textarea
                                    className="outline-none w-full h-[96px] bg-[#E5E5E5] rounded-[6px] p-4 focus:ring-2 focus:ring-[#5179EF] resize-none"
                                    placeholder="Adicione observações sobre a consulta..."
                                />
                                <button className="mt-2 bg-[#5179EF] text-white px-4 py-2 rounded-lg">
                                    Salvar Observações
                                </button>
                            </div>
                        </li>
                    ))}
                </ul>
            </div>
        </section>
    );
}
