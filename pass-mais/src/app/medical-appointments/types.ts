export interface Doctor {
    id: string;
    name: string;
    specialty: string;
    crm: string;
    bio: string;
    averageRating: number;
    reviewsCount: number;
    photo: string | null;
    address?: string | null;
    clinicName?: string | null;
    clinicStreetAndNumber?: string | null;
    clinicCity?: string | null;
    clinicPostalCode?: string | null;
    consultationPrice?: number | null;
}
