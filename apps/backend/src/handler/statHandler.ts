import { Hono } from "hono";

import { getAllStatData } from "@/db/statRepository";
import type { Context } from "@/lib/context";

const statistics = new Hono<Context>().get("/", async (c) => {
	const data = await getAllStatData();
	return c.json(data, 200);
});

export default statistics;

export type StatisticsType = typeof statistics;
