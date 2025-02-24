import { db } from "./connect";

export async function getAllInfByGender() {
	return await db
		.selectFrom("informant")
		.select(({ eb }) => ["gender", eb.fn.count("gender").as("gendercount")])
		.groupBy("gender")
		.execute();
}

export async function getAllLocations() {
	return await db
		.selectFrom("place")
		.select(({ eb }) => [eb.fn.countAll().as("total")])
		.execute();
}

export async function getAllPhenCount() {
	return await db
		.selectFrom("phenomenon")
		.select(({ eb }) => [eb.fn.countAll().as("total")])
		.execute();
}

export async function getAllStatData() {
	const dbQuery = db.with("inf_gender", (query) =>
		query
			.selectFrom("informant")
			.select(({ eb }) => [eb.ref("gender").as("type"), eb.fn.count("gender").as("total")])
			.groupBy("gender"),
	);
	return await dbQuery.selectFrom("inf_gender").execute();
}
