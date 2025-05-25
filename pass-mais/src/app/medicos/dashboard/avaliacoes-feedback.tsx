"use client";

interface AvaliacoesFeedbackProps {
    reviews: { id: number; patient: string; rating: number; comment: string }[];
}

export default function AvaliacoesFeedback({ reviews }: AvaliacoesFeedbackProps) {
    const averageRating = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length || 0;

    return (
        <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-6">Avaliações e Feedback</h2>
            <div className="bg-white shadow-lg rounded-lg p-6 mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Média de Avaliações</h3>
                <p className="text-3xl font-bold text-[#5179EF]">{averageRating.toFixed(1)}</p>
            </div>
            <div className="bg-white shadow-lg rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Comentários</h3>
                <ul className="space-y-4">
                    {reviews.map((review) => (
                        <li key={review.id} className="border-b pb-2">
                            <p className="text-gray-900 font-medium">{review.patient}</p>
                            <p className="text-gray-600">Nota: {review.rating}/5</p>
                            <p className="text-gray-600">{review.comment}</p>
                        </li>
                    ))}
                </ul>
            </div>
        </section>
    );
}