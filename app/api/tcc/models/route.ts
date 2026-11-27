import { NextResponse } from "next/server";
import { StatusVersaoModeloInstitucional } from "@/lib/generated/prisma/enums";
import {
  createInstitutionalModel,
  listInstitutionalModels,
} from "@/lib/tcc/model-service";
import {
  modelListQuerySchema,
} from "@/lib/tcc/api-schemas";
import {
  isTccModelManager,
  requireTccModelManager,
  runTccApi,
} from "@/lib/tcc/api";

export async function GET(request: Request) {
  return runTccApi(async (userId) => {
    const query = modelListQuerySchema.parse(
      Object.fromEntries(new URL(request.url).searchParams.entries()),
    );
    const active =
      query.ativo === undefined ? undefined : query.ativo === "true";
    const status = query.status as
      | StatusVersaoModeloInstitucional
      | undefined;
    return NextResponse.json(
      await listInstitutionalModels(active, status, isTccModelManager(userId)),
    );
  });
}

export async function POST(request: Request) {
  return runTccApi(async (userId) => {
    requireTccModelManager(userId);
    const model = await createInstitutionalModel(await request.json());
    return NextResponse.json(model, { status: 201 });
  });
}
