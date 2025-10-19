import { NextResponse } from "next/server";

import { removeMemberFromStore } from "../../mock-data";

export async function DELETE(_: Request, context: any) {
    const userId = context?.params?.userId;
    if (typeof userId === "string" && userId.length > 0) {
        removeMemberFromStore(userId);
    }
    return new NextResponse(null, { status: 204 });
}
