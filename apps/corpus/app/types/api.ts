import type { InferResponseType } from "hono/client";

import type { ApiClient } from "@/composables/use-api-client";

export type APITranscripts = InferResponseType<ApiClient["corpus"]["corpus"][":id"]["$get"], 200>;
export type APITranscriptsWithBookmark = (APITranscripts[number] & { bookmarked: boolean })[];

type ExcludeStrings<T> = T extends string ? never : T;

export type APITranscript = ExcludeStrings<
	InferResponseType<ApiClient["corpus"]["transcript"][":id"][":format"]["$get"], 200>
>;

export type APIToken = APITranscript["transcript_data"];

export type APITranscriptPreview = InferResponseType<
	ApiClient["corpus"]["preview"][":id"]["$get"],
	200
>;

export type APITranscriptFileData = APITranscriptPreview["fileData"]["data"][0];

export type APIEvent = APITranscriptFileData["events"][0];

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
	text: string;
	hasTags: boolean;
}
