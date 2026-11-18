import type { DbHit } from "#shared/utils/db-records";

export interface DbElasticResponse {
	hits: {
		hits: DbHit[];
		total: { value: number; relation: string } | number;
	};
	timed_out?: boolean;
	_shards?: { failed: number };
}

export interface DbCollectionResult {
	id: number;
	title: string;
	description: string | null;
}

export interface DbCollectionPage<T> {
	count: number;
	results: T[];
}

export function dbUpstream<T>(baseUrl: string, path: string, body?: Record<string, unknown>) {
	if (!baseUrl) {
		throw createError({ statusCode: 503, statusMessage: "WBÖ data service unavailable" });
	}
	const base = baseUrl.endsWith("/") ? baseUrl : baseUrl + "/";
	return $fetch<T>(new URL(path, base).toString(), {
		method: body ? "POST" : "GET",
		body,
		timeout: 15_000,
		retry: 0,
	}).catch((cause: unknown) => {
		throw createError({ statusCode: 502, statusMessage: "WBÖ data service unavailable", cause });
	});
}
