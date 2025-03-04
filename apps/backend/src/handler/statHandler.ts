import { Hono } from "hono";

import { getAgeBuckets, getAllStatData } from "@/db/statRepository";
import type { Context } from "@/lib/context";

const statistics = new Hono<Context>().get("/", async (c) => {
	const { projectId, buckets } = c.req.query();

	let projectIdParsed = parseInt(projectId ?? "1");
	if (Number.isNaN(projectIdParsed) || projectIdParsed < 0) {
		projectIdParsed = 1;
	}

	// Check if buckets is an array of numbers
	// If not set default buckets
	let parsedBuckets = JSON.parse(buckets ?? "[]") as Array<number>;
	if (parsedBuckets.length === 0) {
		parsedBuckets = [30, 50, 100];
	}

	const data = await getAllStatData(projectIdParsed);

	const ageBuckets = await getAgeBuckets(projectIdParsed, parsedBuckets);

	return c.json({ age: ageBuckets[0], ...data[0] }, 200);
});

export default statistics;

export type StatisticsType = typeof statistics;
