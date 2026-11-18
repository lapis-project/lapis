import type { DbCollectionPage, DbCollectionResult } from "../../utils/db-upstream";

function formatCollection(result: DbCollectionResult) {
	return { id: String(result.id), name: result.title, description: result.description ?? "" };
}

export default defineEventHandler(async (event) => {
	const { ids, page, title } = getQuery(event);
	const { dbCollectionsBaseUrl, dbUseMock } = useRuntimeConfig(event);
	if (dbUseMock) return { data: [], count: 0 };

	if (typeof ids === "string" && ids) {
		const requestedIds = [...new Set(ids.split(","))];
		if (requestedIds.length > 25 || requestedIds.some((id) => !/^[1-9]\d{0,9}$/u.test(id))) {
			throw createError({ statusCode: 400, statusMessage: "Invalid WBÖ collection IDs" });
		}
		const data = (
			await Promise.all(
				requestedIds.map(async (id) => {
					try {
						const result = await dbUpstream<DbCollectionResult>(
							dbCollectionsBaseUrl,
							`collections/${id}/`,
						);
						return formatCollection(result);
					} catch (error: unknown) {
						const upstreamStatus = (error as { cause?: { statusCode?: number } }).cause?.statusCode;
						if (upstreamStatus === 404) return null;
						throw error;
					}
				}),
			)
		).filter((collection) => collection !== null);
		return { data, count: data.length };
	}

	const pageNumber = typeof page === "string" ? Number(page) : 1;
	const query = new URLSearchParams({
		page: String(Number.isSafeInteger(pageNumber) && pageNumber > 0 ? pageNumber : 1),
		page_size: "25",
		title: typeof title === "string" ? title.trim().slice(0, 200) : "",
	});
	const result = await dbUpstream<DbCollectionPage<DbCollectionResult>>(
		dbCollectionsBaseUrl,
		`collections/?${query}`,
	);
	return { data: result.results.map(formatCollection), count: result.count };
});
