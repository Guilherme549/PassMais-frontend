import { NextResponse } from "next/server";

import { markJoinCodeAsRevoked } from "../../mock-data";

type RouteParams = {
    params: { id: string };
};

export async function DELETE(_: Request, { params }: RouteParams) {
    if (params?.id) {
        markJoinCodeAsRevoked(params.id);
    }
    return new NextResponse(null, { status: 204 });
}
