export interface Doctor {
    id: string;
    name: string;
    specialty: string;
    crm: string;
    bio: string;
    averageRating: number;
    reviewsCount: number;
    address?: string | null;
}
