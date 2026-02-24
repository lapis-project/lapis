import type { AppType } from "@lapis/backend/api";
import type { InferResponseType } from "hono/client";

export type ApiRoutes = AppType;

export type ApiRoutePath = keyof ApiRoutes;

export type ApiRouteMethod<P extends ApiRoutePath> = keyof ApiRoutes[P];

export type ExtractResponse<F, Code extends number = 200> =
  InferResponseType<F, Code>;

export type APIGetCorpus =
  ApiRoutes["corpus/corpus/:id"]["$get"];

export type APITranscripts =
  ExtractResponse<APIGetCorpus, 200>;

export type APITranscriptsWithBookmark =
  (APITranscripts[number] & { bookmarked: boolean })[];

export type APIGetTranscript =
  ApiRoutes["corpus/transcript/:id/:format"]["$get"];

export type APITranscript = ExtractResponse<APIGetTranscript>;