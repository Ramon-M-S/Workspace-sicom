import { NextResponse } from "next/server";
import {
  getInstitutionalModelVersion,
  updateInstitutionalModelDraft,
} from "@/lib/tcc/model-service";
import {
  isTccModelManager,
  parseResourceId,
  requireTccModelManager,
  runTccApi,
} from "@/lib/tcc/api";

type RouteContext = {
  params: { modelId: string; versionId: string };
};

export async function GET(_request: Request, { params }: RouteContext) {
  return runTccApi(async (userId) =>
    NextResponse.json(
      await getInstitutionalModelVersion(
        parseResourceId(params.modelId),
        parseResourceId(params.versionId),
        isTccModelManager(userId),
      ),
    ),
  );
}

export async function PATCH(request: Request, { params }: RouteContext) {
  return runTccApi(async (userId) => {
    requireTccModelManager(userId);
    return NextResponse.json(
      await updateInstitutionalModelDraft(
        parseResourceId(params.modelId),
        parseResourceId(params.versionId),
        await request.json(),
      ),
    );
  });
}
