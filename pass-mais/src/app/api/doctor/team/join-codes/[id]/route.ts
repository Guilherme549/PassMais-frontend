import { NextResponse } from "next/server";

import { markJoinCodeAsRevoked } from "../../mock-data";

export async function DELETE(_: Request, context: any) {
    const id = context?.params?.id;
    if (typeof id === "string" && id.length > 0) {
        markJoinCodeAsRevoked(id);
    }
    return new NextResponse(null, { status: 204 });
}
