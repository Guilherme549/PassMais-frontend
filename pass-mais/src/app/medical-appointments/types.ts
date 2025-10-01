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
    clinicState?: string | null;
    clinicPostalCode?: string | null;
    consultationPrice?: number | null;
    serviceLocations?: Array<{
        name: string | null;
        city: string | null;
        state: string | null;
        address: string | null;
        postalCode: string | null;
    }>;
}

export interface DoctorScheduleDay {
    isoDate: string;
    label: string;
    source: "specific" | "recurring" | "none";
    slots: string[];
    blocked: boolean;
}

export interface DoctorSchedule {
    doctorId: string;
    doctorName: string;
    doctorSpecialty: string;
    doctorCrm: string;
    timezone: string;
    startDate: string;
    endDate: string;
    days: DoctorScheduleDay[];
}
