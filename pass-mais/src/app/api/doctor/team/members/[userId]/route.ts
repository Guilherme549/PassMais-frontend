import { NextResponse } from "next/server";

import { removeMemberFromStore } from "../../mock-data";

type RouteParams = {
    params: { userId: string };
};

export async function DELETE(_: Request, { params }: RouteParams) {
    if (params?.userId) {
        removeMemberFromStore(params.userId);
    }
    return new NextResponse(null, { status: 204 });
}
