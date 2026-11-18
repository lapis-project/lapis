import { dbColumns, formatDbRecord } from "#shared/utils/db-records";
import type { DbQuery } from "#shared/utils/db-search";

import { dbMockHits } from "./db-mock-data";

const rows = dbMockHits.map(formatDbRecord);
const collator = new Intl.Collator("de", { numeric: true, sensitivity: "base" });

export function browseDbMock({ page, pageSize, terms, sort, collectionIds }: DbQuery) {
	const matches = collectionIds.length
		? []
		: rows.filter((row) =>
				terms.every(({ field, query }) => {
					const needle = query.toLocaleLowerCase("de");
					return dbColumns.some(
						({ key, searchField }) =>
							searchField &&
							(!field || field === searchField) &&
							row[key].toLocaleLowerCase("de").includes(needle),
					);
				}),
			);
	if (sort) {
		matches.sort((a, b) => collator.compare(a[sort.key], b[sort.key]) * (sort.descending ? -1 : 1));
	}
	const offset = (page - 1) * pageSize;
	return {
		data: matches.slice(offset, offset + pageSize),
		totalCount: matches.length,
		pageableCount: matches.length,
		page,
	};
}
