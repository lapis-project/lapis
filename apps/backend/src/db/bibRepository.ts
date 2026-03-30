import { db } from "@/db/connect.ts";

export async function getPaginatedBibliography(page: number, limit: number) {
	const offset = (page - 1) * limit;

	const data = await db
		.selectFrom("bibliography")
		.selectAll()
		.orderBy("title", "asc")
		.limit(limit)
		.offset(offset)
		.execute();

	const totalResults = await db
		.selectFrom("bibliography")
		.select((eb) => eb.fn.countAll().as("count"))
		.executeTakeFirst();

	return {
		data,
		totalResults: Number(totalResults ? totalResults.count : 0),
		page,
		pageSize: limit,
		totalPages: Math.ceil(Number(totalResults ? totalResults.count : 0) / limit),
	};
}

export async function getSingleBibliographyEntry(id: string) {
	return await db
		.selectFrom("bibliography")
		.where("bibliography.name_bibliography", "=", id)
		.execute();
}
