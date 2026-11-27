import { NextResponse } from "next/server";
import {
  parseResourceId,
  runTccApi,
} from "@/lib/tcc/api";
import { replaceTccProjectAuthors } from "@/lib/tcc/project-service";

type RouteContext = { params: { projectId: string } };

export async function PUT(request: Request, { params }: RouteContext) {
  return runTccApi(async (userId) => {
    const projectId = parseResourceId(params.projectId);
    const authors = await replaceTccProjectAuthors(
      userId,
      projectId,
      await request.json(),
    );
    return NextResponse.json(authors);
  });
}
