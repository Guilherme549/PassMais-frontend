export type MockTeamMember = {
    id: string;
    fullName: string;
    email: string;
    phone?: string | null;
    joinedAt: string;
};

export type MockJoinCode = {
    id: string;
    code: string;
    expiresAt: string | null;
    usesLeft: number;
    status: "ativo" | "expirado" | "sem-usos" | "revogado";
    secretaryName?: string;
    secretaryEmail?: string;
};

const INITIAL_MEMBERS: MockTeamMember[] = [
    {
        id: "sec-001",
        fullName: "Ana Souza",
        email: "ana.souza@clinicavida.com",
        phone: "(11) 91234-5678",
        joinedAt: "2024-05-10T12:00:00-03:00",
    },
    {
        id: "sec-002",
        fullName: "Marcos Lima",
        email: "marcos.lima@clinicavida.com",
        phone: null,
        joinedAt: "2023-11-22T09:30:00-03:00",
    },
];

const INITIAL_JOIN_CODES: MockJoinCode[] = [
    {
        id: "code-abc123",
        code: "9F3K-PASS",
        expiresAt: "2024-12-31T23:59:59-03:00",
        usesLeft: 3,
        status: "ativo",
        secretaryName: "Ana Souza",
        secretaryEmail: "ana.souza@clinicavida.com",
    },
    {
        id: "code-expired",
        code: "7XYJ-2023",
        expiresAt: "2023-12-31T23:59:59-03:00",
        usesLeft: 0,
        status: "expirado",
        secretaryName: "Equipe antiga",
        secretaryEmail: "contato@clinicavida.com",
    },
];

let membersStore: MockTeamMember[] = [...INITIAL_MEMBERS];
let joinCodesStore: MockJoinCode[] = [...INITIAL_JOIN_CODES];

export function getTeamSnapshot() {
    return {
        members: membersStore,
        joinCodes: joinCodesStore,
    };
}

export function addJoinCodeToStore(code: MockJoinCode) {
    joinCodesStore = [code, ...joinCodesStore];
}

export function markJoinCodeAsRevoked(id: string) {
    joinCodesStore = joinCodesStore.map((code) =>
        code.id === id
            ? {
                  ...code,
                  status: "revogado",
                  usesLeft: 0,
              }
            : code,
    );
}

export function removeMemberFromStore(userId: string) {
    membersStore = membersStore.filter((member) => member.id !== userId);
}
