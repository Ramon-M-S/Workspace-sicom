import { NextResponse } from "next/server";
import {
  createInstitutionalModelDraft,
  listInstitutionalModelVersions,
} from "@/lib/tcc/model-service";
import {
  parseResourceId,
  isTccModelManager,
  requireTccModelManager,
  runTccApi,
} from "@/lib/tcc/api";

type RouteContext = { params: { modelId: string } };

export async function GET(_request: Request, { params }: RouteContext) {
  return runTccApi(async (userId) =>
    NextResponse.json(
      await listInstitutionalModelVersions(
        parseResourceId(params.modelId),
        isTccModelManager(userId),
      ),
    ),
  );
}

export async function POST(request: Request, { params }: RouteContext) {
  return runTccApi(async (userId) => {
    requireTccModelManager(userId);
    const version = await createInstitutionalModelDraft(
      parseResourceId(params.modelId),
      await request.json(),
    );
    return NextResponse.json(version, { status: 201 });
  });
}
