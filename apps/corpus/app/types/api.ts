import type { InferResponseType } from "hono/client";

import type { ApiClient } from "@/composables/use-api-client";

export type APITranscripts = InferResponseType<ApiClient["corpus"]["corpus"][":id"]["$get"], 200>;
export type APITranscriptsWithBookmark = (APITranscripts[number] & { bookmarked: boolean })[];

type ExcludeStrings<T> = T extends string ? never : T;

export type APITranscript = ExcludeStrings<
	InferResponseType<ApiClient["corpus"]["transcript"][":id"][":format"]["$get"], 200>
>;

export type APITranscriptPreview = InferResponseType<
	ApiClient["corpus"]["preview"][":id"]["$get"],
	200
>;
