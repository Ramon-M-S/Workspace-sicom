import { NextResponse } from "next/server";
import {
  getInstitutionalModel,
  updateInstitutionalModelMetadata,
} from "@/lib/tcc/model-service";
import {
  isTccModelManager,
  parseResourceId,
  requireTccModelManager,
  runTccApi,
} from "@/lib/tcc/api";

type RouteContext = { params: { modelId: string } };

export async function GET(_request: Request, { params }: RouteContext) {
  return runTccApi(async (userId) =>
    NextResponse.json(
      await getInstitutionalModel(
        parseResourceId(params.modelId),
        isTccModelManager(userId),
      ),
    ),
  );
}

export async function PATCH(request: Request, { params }: RouteContext) {
  return runTccApi(async (userId) => {
    requireTccModelManager(userId);
    return NextResponse.json(
      await updateInstitutionalModelMetadata(
        parseResourceId(params.modelId),
        await request.json(),
      ),
    );
  });
}
