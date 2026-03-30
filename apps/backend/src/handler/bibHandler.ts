import { log } from "@acdh-oeaw/lib";
import { vValidator } from "@hono/valibot-validator";
import { Hono } from "hono";
import { object, optional, pipe, string, transform } from "valibot";

import { getPaginatedBibliography, getSingleBibliographyEntry } from "@/db/bibRepository.ts";
import type { AppEnv } from "@/lib/context.ts";

const paginationSchema = object({
	page: optional(pipe(string(), transform(Number)), "1"),
	pageSize: optional(pipe(string(), transform(Number)), "50"),
});

const searchSchema = object({
	bib_id: string(),
});

const bibliography = new Hono<AppEnv>()
	.get("/", vValidator("query", paginationSchema), async (c) => {
		const { page, pageSize } = c.req.valid("query");

		try {
			const result = await getPaginatedBibliography(page, pageSize);

			const baseUrl = new URL(c.req.url);

			// Helper function to cleanly build URLs for specific pages
			const getPageUrl = (targetPage: number) => {
				baseUrl.searchParams.set("page", String(targetPage));
				baseUrl.searchParams.set("pageSize", String(pageSize));
				return baseUrl.toString();
			};
			const response = {
				...result,
				currentUrl: getPageUrl(page),
				nextUrl: page < result.totalPages ? getPageUrl(page + 1) : null,
				prevUrl: page > 1 ? getPageUrl(page - 1) : null,
			};

			return c.json(response, 200);
		} catch (error) {
			log.error(`Error while fetching bibliography: `, error);
			return c.json({ error: "Failed to fetch bibliography" }, 500);
		}
	})
	.get("/single", vValidator("query", searchSchema), async (c) => {
		const { bib_id } = c.req.valid("query");

		try {
			const result = await getSingleBibliographyEntry(bib_id);
			return c.json(result, 200);
		} catch (error) {
			log.error(`Error while fetching bibliography: `, error);
			return c.json({ error: "Failed to fetch bibliography" }, 500);
		}
	});

export default bibliography;

export type ArticleRoute = typeof bibliography;
