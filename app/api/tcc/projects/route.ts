import { NextResponse } from "next/server";
import { runTccApi } from "@/lib/tcc/api";
import {
  createTccProject,
  listTccProjects,
} from "@/lib/tcc/project-service";

export async function GET() {
  return runTccApi(async (userId) =>
    NextResponse.json(await listTccProjects(userId)),
  );
}

export async function POST(request: Request) {
  return runTccApi(async (userId) => {
    const project = await createTccProject(userId, await request.json());
    return NextResponse.json(project, { status: 201 });
  });
}
