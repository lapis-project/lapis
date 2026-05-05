import { log } from "@acdh-oeaw/lib";
import { schedule } from "node-cron";

import { db } from "@/db/connect.ts";
import type { ZoteroCollection } from "@/types/apiTypes.ts";

export const setupZoteroSync = () => {
	// Cron expression for 3 am every day
	schedule("0 14 * * *", async () => {
		log.info("Starting daily Zotero sync...");
		try {
			await syncZoteroCollection();
			log.success("Zotero sync completed.");
		} catch (error) {
			log.error("Zotero sync failed", error);
		}
	});
};

async function syncZoteroCollection() {
	const collectionId = process.env.ZOTERO_GROUP_ID!;
	// const collectionKey = process.env.ZOTERO_COLLECTION_KEY!;
	log.info(`Fetching collection with id: ${collectionId}`);
	if (Number.isNaN(collectionId)) {
		return;
	}

	let start = 0;

	const limit = 100;

	while (start >= 0) {
		const url = `https://api.zotero.org/groups/${collectionId}/items?format=json&limit=${String(limit)}&start=${String(start)}`;
		const response = await fetch(url);

		const items = (await response.json()) as Array<ZoteroCollection>;

		if (items.length === 0) {
			break;
		}
		for (const item of items) {
			if (item.data.itemType === "attachment" || item.data.itemType === "note") {
				continue;
			}

			await db
				.insertInto("bibliography")
				.values({
					name_bibliography: item.key,
					title: item.data.title || "Unknown Title",
					data: JSON.stringify(item),
				})
				.onConflict((oc) => oc.column("name_bibliography").doNothing())
				.execute();
		}
		log.info(`Fetched and synced items offset ${String(start)} to ${String(start + limit)}`);
		start += limit;
	}
	log.info("Finished syncing zotero collection with database");
}
