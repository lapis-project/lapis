import { dbColumns, formatDbRecord } from "#shared/utils/db-records";
import {
	buildDbSearchQuery,
	dbResultWindow,
	dbSourceFields,
	parseDbQuery,
} from "#shared/utils/db-search";
import type { DbQuery } from "#shared/utils/db-search";

import type { DbCollectionPage, DbElasticResponse } from "../../utils/db-upstream";

export default defineEventHandler(async (event) => {
	let params: DbQuery;
	const body = await readBody<unknown>(event);
	try {
		params = parseDbQuery(body);
	} catch {
		throw createError({ statusCode: 400, statusMessage: "Invalid WBÖ database query" });
	}

	const { dbCollectionsBaseUrl, dbElasticBaseUrl, dbUseMock } = useRuntimeConfig(event);
	if (dbUseMock) {
		const { browseDbMock } = await import("../../utils/db-mock");
		return browseDbMock(params);
	}

	const { collectionIds, pageSize, sort } = params;
	if (collectionIds.length > 0) {
		const query = new URLSearchParams({ page: String(params.page), page_size: String(pageSize) });
		for (const id of collectionIds) query.append("in_collections", id);

		const collectionPage = await dbUpstream<DbCollectionPage<{ es_id: string }>>(
			dbCollectionsBaseUrl,
			`documents/?${query}`,
		).catch((error: unknown) => {
			const upstreamStatus = (error as { cause?: { statusCode?: number } }).cause?.statusCode;
			if (upstreamStatus === 404) return { count: 0, results: [] };
			throw error;
		});
		const ids = [...new Set(collectionPage.results.map(({ es_id }) => es_id).filter(Boolean))];
		const rowsById = new Map(
			ids.length > 0
				? (
						await queryElastic(dbElasticBaseUrl, {
							size: ids.length,
							query: { ids: { values: ids } },
						})
					).hits.hits.map((hit) => [hit._id, formatDbRecord(hit)] as const)
				: [],
		);
		return {
			data: ids.flatMap((id) => rowsById.get(id) ?? []),
			totalCount: collectionPage.count,
			pageableCount: collectionPage.count,
			page: params.page,
		};
	}

	const { page } = params;
	const from = (page - 1) * pageSize;
	const sortField = dbColumns.find(({ key }) => key === sort?.key)?.sortField;
	const elastic = await queryElastic(dbElasticBaseUrl, {
		from,
		size: pageSize,
		query: buildDbSearchQuery(params),
		track_total_hits: true,
		sort:
			sortField && sort
				? [
						{
							[`${sortField}.keyword`]: {
								order: sort.descending ? "desc" : "asc",
								unmapped_type: "keyword",
							},
						},
					]
				: undefined,
	});
	const { hits, total } = elastic.hits;
	const totalCount = typeof total === "number" ? total : total.value;

	return {
		data: hits.map(formatDbRecord),
		totalCount,
		pageableCount: Math.min(totalCount, dbResultWindow),
		page,
	};
});

async function queryElastic(baseUrl: string, query: Record<string, unknown>) {
	const response = await dbUpstream<DbElasticResponse>(baseUrl, "_search", {
		_source: dbSourceFields,
		...query,
	});
	if (response.timed_out || response._shards?.failed || !response.hits) {
		throw createError({
			statusCode: 502,
			statusMessage: "WBÖ data service returned incomplete results",
		});
	}
	return response;
}
