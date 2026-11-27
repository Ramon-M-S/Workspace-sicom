import { NextResponse } from "next/server";
import {
  parseResourceId,
  runTccApi,
} from "@/lib/tcc/api";
import {
  listTccProjectMembers,
  replaceTccProjectMembers,
} from "@/lib/tcc/project-service";

type RouteContext = { params: { projectId: string } };

export async function GET(_request: Request, { params }: RouteContext) {
  return runTccApi(async (userId) => {
    const projectId = parseResourceId(params.projectId);
    return NextResponse.json(
      await listTccProjectMembers(userId, projectId),
    );
  });
}

export async function PUT(request: Request, { params }: RouteContext) {
  return runTccApi(async (userId) => {
    const projectId = parseResourceId(params.projectId);
    const members = await replaceTccProjectMembers(
      userId,
      projectId,
      await request.json(),
    );
    return NextResponse.json(members);
  });
}
