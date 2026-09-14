import {
	DummyDriver,
	Kysely,
	type LogEvent,
	PostgresAdapter,
	PostgresIntrospector,
	PostgresQueryCompiler,
} from "kysely";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { DB } from "@/types/db.ts";

const logQuery = vi.fn<(event: LogEvent) => void>();
const testDb = new Kysely<DB>({
	dialect: {
		createAdapter: () => new PostgresAdapter(),
		createDriver: () => new DummyDriver(),
		createIntrospector: (db) => new PostgresIntrospector(db),
		createQueryCompiler: () => new PostgresQueryCompiler(),
	},
	log: logQuery,
});
const selectFrom = vi.spyOn(testDb, "selectFrom");
vi.mock("@/db/connect.ts", () => ({ db: testDb }));
const { getAllTranscripts } = await import("@/db/corpusRepository.ts");

describe("Corpus repository", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("matches nothing for an explicit empty transcript restriction", async () => {
		expect(await getAllTranscripts(2, { transcripts: [] })).toEqual([]);
		expect(selectFrom).not.toHaveBeenCalled();
	});

	it("applies postal-code ranges as grouped inclusive alternatives", async () => {
		await getAllTranscripts(2, {
			postal_code_ranges: [
				[6000, 6691],
				[9900, 9992],
			],
		});

		const query = logQuery.mock.calls[0]?.[0].query;
		expect(query?.sql).toContain(
			'and (("place"."plz" >= $3 and "place"."plz" <= $4) or ' +
				'("place"."plz" >= $5 and "place"."plz" <= $6))',
		);
		expect(query?.parameters).toEqual([2, 2, 6000, 6691, 9900, 9992]);
	});

	it("does not apply a postal-code restriction when ranges are omitted", async () => {
		await getAllTranscripts(2);

		expect(logQuery.mock.calls[0]?.[0].query.sql).not.toContain('"place"."plz" >=');
	});

	it("matches nothing for explicit empty postal-code ranges", async () => {
		await getAllTranscripts(2, { postal_code_ranges: [] });

		expect(logQuery.mock.calls[0]?.[0].query.sql).toContain("and 1 = 0");
	});
});
