"use client";

interface NotificacoesProps {
    notifications: { id: number; message: string; date: string }[];
}

export default function Notificacoes({ notifications }: NotificacoesProps) {
    return (
        <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Notificações</h2>
            <div className="bg-white shadow-lg rounded-lg p-6">
                <ul className="space-y-4">
                    {notifications.map((notif) => (
                        <li key={notif.id} className="border-b pb-2">
                            <p className="text-gray-900">{notif.message}</p>
                            <p className="text-gray-600 text-sm">{notif.date}</p>
                        </li>
                    ))}
                </ul>
            </div>
        </section>
    );
}