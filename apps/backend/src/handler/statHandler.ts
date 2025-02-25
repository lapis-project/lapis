import { Hono } from "hono";

import { getAllStatData } from "@/db/statRepository";
import type { Context } from "@/lib/context";

const statistics = new Hono<Context>().get("/", async (c) => {
	const { projectId } = c.req.query();

	let projectIdParsed = parseInt(projectId ?? "1");
	if (Number.isNaN(projectIdParsed) || projectIdParsed < 0) {
		projectIdParsed = 1;
	}

	const data = await getAllStatData(projectIdParsed);
	return c.json(data, 200);
});

export default statistics;

export type StatisticsType = typeof statistics;
