import type { InferResponseType } from "hono/client";

import type { ApiClient } from "@/composables/use-api-client";

export type APITranscripts = InferResponseType<ApiClient["corpus"]["corpus"][":id"]["$get"], 200>;
export type APITranscriptsWithBookmark = (APITranscripts[number] & { bookmarked: boolean })[];

export type APITranscript = InferResponseType<ApiClient["corpus"]["transcript"][":id"][":format"]["$get"], 200>;
