import type { InferResponseType } from "hono/client";

import type { ApiClient } from "@/composables/use-api-client";

export type APITranscripts = InferResponseType<ApiClient["corpus"]["corpus"][":id?"]["$get"], 200>;
export type APITranscriptsWithBookmark = (APITranscripts[number] & { bookmarked: boolean })[];

type ExcludeStrings<T> = T extends string ? never : T;

export type APITranscript = ExcludeStrings<
	InferResponseType<ApiClient["corpus"]["transcript"][":transcript_id"][":format"]["$get"], 200>
>;

export type APIPlaces = ExcludeStrings<
	InferResponseType<ApiClient["corpus"]["place"][":id"]["$get"], 200>
>;

export type APIFilter = ExcludeStrings<
	InferResponseType<ApiClient["corpus"]["filters"]["$get"], 200>
>;

export type TranscriptPreviewResponse = InferResponseType<
	ApiClient["corpus"]["preview"][":transcript_id"]["$get"],
	200
>;

export type APITranscriptData = TranscriptPreviewResponse["transcript_data"];
export type APIMetadata = TranscriptPreviewResponse["metadata"];

export type APIKwicResponse = ExcludeStrings<
	InferResponseType<ApiClient["corpus"]["search"]["kwic"]["$get"], 200>
>;

type KwicLines = NonNullable<APIKwicResponse>["Lines"];
export type KwicLine = NonNullable<KwicLines>[number];

export type Speaker = {
	gender: string | null;
	sigle: string | null;
	age: string | null;
};

export interface Event {
	start: string;
	end: string;
	ortho: Array<EventToken>;
	lu: Array<EventToken>;
	phon: Array<EventToken>;
}

export type TimestampEvent = {
	timestamps: string[];
	speakerEvents: Record<number, Event[]>;
};

export interface EventToken {
	text: string | null;
	hasTags: boolean;
}

export interface TranscriptFilters {
	age_lower?: number;
	age_upper?: number;
	loc_name?: string;
	dialect_competence?: number;
	standard_competence?: number;
	gender?: string;
	comment_search?: string;
	comment_search_mode?: "simple" | "regex";
	projects?: Array<string>;
	settings?: Array<string>;
	transcript_name?: string;
	instance_id?: number;
}
