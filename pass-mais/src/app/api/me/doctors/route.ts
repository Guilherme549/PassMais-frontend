import { NextResponse } from "next/server";

const MOCK_DOCTORS = [
    { id: "doc-carlos", name: "Dr. Carlos Mendes" },
    { id: "doc-joana", name: "Dra. Joana Prado" },
    { id: "doc-fernando", name: "Dr. Fernando Tanaka" },
];

export async function GET() {
    return NextResponse.json(MOCK_DOCTORS);
}
