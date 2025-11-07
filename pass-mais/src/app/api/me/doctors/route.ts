import { NextResponse } from "next/server";

export async function GET() {
    return NextResponse.json(
        {
            message:
                "Endpoint indisponível. Utilize o payload.doctors do access token (JWT) para listar médicos vinculados.",
        },
        { status: 404 },
    );
}
