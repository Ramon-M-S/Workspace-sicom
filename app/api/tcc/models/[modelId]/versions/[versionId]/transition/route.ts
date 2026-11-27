import { NextResponse } from "next/server";
import { transitionVersionSchema } from "@/lib/tcc/api-schemas";
import {
  parseResourceId,
  requireTccModelManager,
  runTccApi,
} from "@/lib/tcc/api";
import { transitionInstitutionalModelVersion } from "@/lib/tcc/model-service";

type RouteContext = {
  params: { modelId: string; versionId: string };
};

export async function POST(request: Request, { params }: RouteContext) {
  return runTccApi(async (userId) => {
    requireTccModelManager(userId);
    const { nextStatus } = transitionVersionSchema.parse(await request.json());
    const version = await transitionInstitutionalModelVersion(
      parseResourceId(params.modelId),
      parseResourceId(params.versionId),
      nextStatus,
    );
    return NextResponse.json(version);
  });
}
