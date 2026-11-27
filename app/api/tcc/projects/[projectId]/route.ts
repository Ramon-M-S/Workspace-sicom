import { NextResponse } from "next/server";
import {
  parseResourceId,
  runTccApi,
} from "@/lib/tcc/api";
import { updateTccProject, getTccProject } from "@/lib/tcc/project-service";

type RouteContext = { params: { projectId: string } };

export async function GET(_request: Request, { params }: RouteContext) {
  return runTccApi(async (userId) =>
    NextResponse.json(
      await getTccProject(
        userId,
        parseResourceId(params.projectId),
        "READ_PROJECT",
      ),
    ),
  );
}

export async function PATCH(request: Request, { params }: RouteContext) {
  return runTccApi(async (userId) => {
    const projectId = parseResourceId(params.projectId);
    return NextResponse.json(
      await updateTccProject(userId, projectId, await request.json()),
    );
  });
}
