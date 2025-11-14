"use client";

import { X } from "lucide-react";
import { useMemo, useState } from "react";

export interface AppointmentBasic {
    id: string;
    doctor: string;
}

export interface SlotDay {
    date: string; // DD/MM/YYYY
    times: string[]; // ["HH:MM"]
}

interface RescheduleModalProps {
    appointment: AppointmentBasic;
    slots: SlotDay[];
    onClose: () => void;
    onConfirm: (payload: { date: string; time: string }) => void;
}

export default function RescheduleModal({ appointment, slots, onClose, onConfirm }: RescheduleModalProps) {
    const [selectedDate, setSelectedDate] = useState<string | null>(null);
    const [selectedTime, setSelectedTime] = useState<string | null>(null);

    const timesForSelectedDate = useMemo(() => {
        return slots.find((d) => d.date === selectedDate)?.times ?? [];
    }, [slots, selectedDate]);

    const handleConfirm = () => {
        if (!selectedDate || !selectedTime) return;
        onConfirm({ date: selectedDate, time: selectedTime });
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center">
            <div className="absolute inset-0 bg-black/30" onClick={onClose} />
            <div className="relative bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 shadow-2xl">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
                    aria-label="Fechar"
                >
                    <X size={22} />
                </button>

                <div className="space-y-6">
                    <div>
                        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Reagendar Consulta</h2>
                        <p className="text-gray-600 mt-1">Selecione uma nova data e horário disponíveis para {appointment.doctor}.</p>
                    </div>

                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">Datas disponíveis</h3>
                        <div className="flex flex-wrap gap-2">
                            {slots.map((d) => (
                                <button
                                    key={d.date}
                                    onClick={() => {
                                        setSelectedDate(d.date);
                                        setSelectedTime(null);
                                    }}
                                    className={`px-3 py-2 rounded-lg border text-sm transition ${
                                        selectedDate === d.date
                                            ? "bg-blue-600 text-white border-blue-600"
                                            : "bg-white text-gray-800 border-gray-300 hover:border-gray-400"
                                    }`}
                                >
                                    {d.date}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-3">Horários disponíveis</h3>
                        {selectedDate ? (
                            <div className="flex flex-wrap gap-2">
                                {timesForSelectedDate.length > 0 ? (
                                    timesForSelectedDate.map((t) => (
                                        <button
                                            key={t}
                                            onClick={() => setSelectedTime(t)}
                                            className={`px-3 py-2 rounded-lg border text-sm transition ${
                                                selectedTime === t
                                                    ? "bg-blue-600 text-white border-blue-600"
                                                    : "bg-white text-gray-800 border-gray-300 hover:border-gray-400"
                                            }`}
                                        >
                                            {t}
                                        </button>
                                    ))
                                ) : (
                                    <p className="text-gray-600">Sem horários para a data selecionada.</p>
                                )}
                            </div>
                        ) : (
                            <p className="text-gray-600">Escolha uma data para ver os horários.</p>
                        )}
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleConfirm}
                            disabled={!selectedDate || !selectedTime}
                            className={`px-4 py-2 rounded-lg text-white transition ${
                                !selectedDate || !selectedTime
                                    ? "bg-blue-300 cursor-not-allowed"
                                    : "bg-[#5179EF] hover:bg-blue-700"
                            }`}
                        >
                            Confirmar reagendamento
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
