import { NextResponse } from "next/server";

import { getTeamSnapshot } from "./mock-data";

export async function GET() {
    return NextResponse.json(getTeamSnapshot());
}
