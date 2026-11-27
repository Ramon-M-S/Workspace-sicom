import { beforeEach, describe, expect, it, vi } from "vitest";

const authMock = vi.hoisted(() => {
  class UsuarioNaoAutenticadoError extends Error {
    constructor() {
      super("Usuário não autenticado.");
      this.name = "UsuarioNaoAutenticadoError";
    }
  }
  return {
    UsuarioNaoAutenticadoError,
    getUsuarioLogado: vi.fn(),
  };
});

vi.mock("../auth-utils", () => ({
  UsuarioNaoAutenticadoError: authMock.UsuarioNaoAutenticadoError,
  getUsuarioLogado: authMock.getUsuarioLogado,
}));

import * as modelRoutes from "@/app/api/tcc/models/route";
import * as modelItemRoutes from "@/app/api/tcc/models/[modelId]/route";
import * as versionRoutes from "@/app/api/tcc/models/[modelId]/versions/route";
import * as versionItemRoutes from "@/app/api/tcc/models/[modelId]/versions/[versionId]/route";
import * as transitionRoutes from "@/app/api/tcc/models/[modelId]/versions/[versionId]/transition/route";
import * as projectRoutes from "@/app/api/tcc/projects/route";
import * as projectItemRoutes from "@/app/api/tcc/projects/[projectId]/route";
import * as authorRoutes from "@/app/api/tcc/projects/[projectId]/authors/route";
import * as memberRoutes from "@/app/api/tcc/projects/[projectId]/members/route";

const routeContext = {
  params: { modelId: "model-a", versionId: "version-a", projectId: "project-a" },
};

function request(method: string, pathname: string): Request {
  return new Request(`http://localhost${pathname}`, {
    method,
    ...(method === "GET"
      ? {}
      : {
          headers: { "content-type": "application/json" },
          body: "{}",
        }),
  });
}

const protectedHandlers: Array<[string, () => Promise<Response>]> = [
  [
    "GET /api/tcc/models",
    () => modelRoutes.GET(request("GET", "/api/tcc/models")),
  ],
  [
    "POST /api/tcc/models",
    () => modelRoutes.POST(request("POST", "/api/tcc/models")),
  ],
  [
    "GET /api/tcc/models/[modelId]",
    () => modelItemRoutes.GET(request("GET", "/api/tcc/models/model-a"), routeContext),
  ],
  [
    "PATCH /api/tcc/models/[modelId]",
    () => modelItemRoutes.PATCH(request("PATCH", "/api/tcc/models/model-a"), routeContext),
  ],
  [
    "GET /api/tcc/models/[modelId]/versions",
    () => versionRoutes.GET(request("GET", "/api/tcc/models/model-a/versions"), routeContext),
  ],
  [
    "POST /api/tcc/models/[modelId]/versions",
    () => versionRoutes.POST(request("POST", "/api/tcc/models/model-a/versions"), routeContext),
  ],
  [
    "GET /api/tcc/models/[modelId]/versions/[versionId]",
    () =>
      versionItemRoutes.GET(
        request("GET", "/api/tcc/models/model-a/versions/version-a"),
        routeContext,
      ),
  ],
  [
    "PATCH /api/tcc/models/[modelId]/versions/[versionId]",
    () =>
      versionItemRoutes.PATCH(
        request("PATCH", "/api/tcc/models/model-a/versions/version-a"),
        routeContext,
      ),
  ],
  [
    "POST /api/tcc/models/[modelId]/versions/[versionId]/transition",
    () =>
      transitionRoutes.POST(
        request(
          "POST",
          "/api/tcc/models/model-a/versions/version-a/transition",
        ),
        routeContext,
      ),
  ],
  [
    "GET /api/tcc/projects",
    () => projectRoutes.GET(),
  ],
  [
    "POST /api/tcc/projects",
    () => projectRoutes.POST(request("POST", "/api/tcc/projects")),
  ],
  [
    "GET /api/tcc/projects/[projectId]",
    () =>
      projectItemRoutes.GET(
        request("GET", "/api/tcc/projects/project-a"),
        routeContext,
      ),
  ],
  [
    "PATCH /api/tcc/projects/[projectId]",
    () =>
      projectItemRoutes.PATCH(
        request("PATCH", "/api/tcc/projects/project-a"),
        routeContext,
      ),
  ],
  [
    "PUT /api/tcc/projects/[projectId]/authors",
    () =>
      authorRoutes.PUT(
        request("PUT", "/api/tcc/projects/project-a/authors"),
        routeContext,
      ),
  ],
  [
    "GET /api/tcc/projects/[projectId]/members",
    () =>
      memberRoutes.GET(
        request("GET", "/api/tcc/projects/project-a/members"),
        routeContext,
      ),
  ],
  [
    "PUT /api/tcc/projects/[projectId]/members",
    () =>
      memberRoutes.PUT(
        request("PUT", "/api/tcc/projects/project-a/members"),
        routeContext,
      ),
  ],
];

describe("autenticação das rotas HTTP TCC", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authMock.getUsuarioLogado.mockRejectedValue(
      new authMock.UsuarioNaoAutenticadoError(),
    );
  });

  it.each(protectedHandlers)("%s responde 401 sem sessão", async (_name, invoke) => {
    const response = await invoke();

    expect(response.status).toBe(401);
    expect(await response.json()).toEqual({ error: "Não autorizado." });
  });
});
