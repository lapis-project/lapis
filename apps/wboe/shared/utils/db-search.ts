import { type DbColumnKey, dbColumns } from "./db-records";

export const dbPageSizes = [10, 25, 50, 100, 500] as const;
export const dbResultWindow = 10_000;
export const dbMaxSearchTerms = 12;
export const dbMaxSearchLength = 250;
export const dbMaxCollectionIds = 25;

export type DbSearchMode = "prefix" | "wildcard" | "fuzzy";

export interface DbSearchTerm {
	query: string;
	field?: string;
}

export interface DbQuery {
	page: number;
	pageSize: number;
	terms: DbSearchTerm[];
	mode: DbSearchMode;
	extended: boolean;
	sort?: { key: DbColumnKey; descending: boolean };
	collectionIds: string[];
}

export const dbSourceFields = [
	"HL",
	"NL",
	"POS",
	"NR",
	"BD/LT*",
	"Ort/LT",
	"BD/KT*",
	"QU",
	"BIBL",
	"Sigle1",
	"Bundesland1",
	"Großregion1",
	"Kleinregion1",
	"Gemeinde1",
	"QDB",
	"entry.@facs",
	"entry.ref",
	"KT*",
	"LT*_teuthonista",
	"LT*_theutonista",
	"GRAM/LT*",
];

const searchFields = new Set(dbColumns.flatMap(({ searchField }) => searchField ?? []));
const sortKeys = new Map<string, DbColumnKey>(
	dbColumns.flatMap(({ key, sortField }) => (sortField ? [[key, key] as const] : [])),
);
const modes = new Set(["prefix", "wildcard", "fuzzy"]);
const contextFields = Array.from({ length: 8 }, (_, index) => `KT${index + 1}`);
const grammarFields = Array.from({ length: 9 }, (_, index) => `GRAM/LT${index + 1}`);
const pronunciationFields = Array.from({ length: 9 }, (_, index) => `LT${index + 1}_teuthonista`);
const fieldGroups = new Map([
	["KT1", contextFields],
	["GRAM/LT1", grammarFields],
	["LT1_teuthonista", pronunciationFields],
]);

function readObject(value: unknown, name: string): Record<string, unknown> {
	if (value === null || typeof value !== "object" || Array.isArray(value)) {
		throw new TypeError(`Invalid ${name}`);
	}
	return value as Record<string, unknown>;
}

function positiveInteger(value: unknown, fallback: number, name: string): number {
	if (value === undefined) return fallback;
	const number = typeof value === "string" && /^\d+$/u.test(value) ? Number(value) : value;
	if (typeof number !== "number" || !Number.isSafeInteger(number) || number < 1) {
		throw new TypeError(`Invalid ${name}`);
	}
	return number;
}

function searchMode(value: unknown): DbSearchMode {
	if (value === undefined) return "fuzzy";
	if (typeof value !== "string" || !modes.has(value)) throw new TypeError("Invalid search mode");
	return value as DbSearchMode;
}

function parseTerms(value: unknown): DbSearchTerm[] {
	if (value === undefined) return [];
	if (!Array.isArray(value) || value.length > dbMaxSearchTerms) {
		throw new TypeError("Invalid search terms");
	}
	return value.flatMap((item: unknown) => {
		const { query, field } = readObject(item, "search term");
		if (typeof query !== "string" || query.length > dbMaxSearchLength) {
			throw new TypeError("Invalid search term text");
		}
		if (field !== undefined && (typeof field !== "string" || !searchFields.has(field))) {
			throw new TypeError("Invalid search field");
		}
		const text = query.trim();
		if (!text) return [];
		return field ? { query: text, field } : { query: text };
	});
}

function parseCollectionIds(value: unknown): string[] {
	if (value === undefined) return [];
	if (!Array.isArray(value) || value.length > dbMaxCollectionIds) {
		throw new TypeError("Invalid collections");
	}
	return [
		...new Set(
			value.map((id: unknown) => {
				const text = typeof id === "number" && Number.isSafeInteger(id) ? String(id) : id;
				if (typeof text !== "string" || !/^[1-9]\d{0,14}$/u.test(text)) {
					throw new TypeError("Invalid collection ID");
				}
				return text;
			}),
		),
	];
}

function parseSort(value: unknown): DbQuery["sort"] {
	if (value === undefined) return undefined;
	const { key, descending } = readObject(value, "sort");
	const sortKey = typeof key === "string" ? sortKeys.get(key) : undefined;
	if (!sortKey || typeof descending !== "boolean") throw new TypeError("Invalid sort");
	return { key: sortKey, descending };
}

export function parseDbQuery(value: unknown): DbQuery {
	const input = readObject(value, "database request");
	const pageSize = positiveInteger(input.pageSize, dbPageSizes[0], "page size");
	if (!dbPageSizes.some((size) => size === pageSize)) throw new TypeError("Invalid page size");
	const collectionIds = parseCollectionIds(input.collectionIds);
	const page = positiveInteger(input.page, 1, "page");
	if (input.extended !== undefined && typeof input.extended !== "boolean") {
		throw new TypeError("Invalid extended columns setting");
	}
	const sort = parseSort(input.sort);
	return {
		page: collectionIds.length > 0 ? page : Math.min(page, Math.floor(dbResultWindow / pageSize)),
		pageSize,
		terms: parseTerms(input.terms),
		mode: searchMode(input.mode),
		extended: input.extended ?? false,
		...(sort && { sort }),
		collectionIds,
	};
}

function expandedFields(field: string): string[] {
	if (field === "ID") return ["ID.keyword"];
	return fieldGroups.get(field) ?? [field];
}

const allSearchFields = dbColumns.flatMap(({ extended, searchField }) =>
	searchField && !extended ? expandedFields(searchField) : [],
);
const extendedSearchFields = dbColumns.flatMap(({ searchField }) =>
	searchField ? expandedFields(searchField) : [],
);

function scopedSearch(field: string, query: string, mode: DbSearchMode) {
	const value = field === "ID.keyword" ? query : query.replace(/[()-]/gu, "").toLowerCase().trim();
	if (!value) return { match_none: {} };
	switch (mode) {
		case "fuzzy":
			return { fuzzy: { [field]: { value, fuzziness: 3 } } };
		case "wildcard":
			return {
				wildcard: { [field]: { value: value.replace(/\\/gu, "\\\\").replace(/\*+/gu, "*") } },
			};
		case "prefix":
			return { prefix: { [field]: { value } } };
	}
}

function queryStringTerm(query: string, mode: "prefix" | "wildcard") {
	// In query_string, angle brackets cannot be escaped and uppercase words can be operators.
	const literal = query
		.replace(/[()<>-]/gu, "")
		.replace(/\b(?:AND|OR|NOT)\b/gu, (operator) => operator.toLowerCase())
		.replace(/[+=&|!{}[\]^"~*?:\\/]/gu, (character) =>
			mode === "wildcard" && (character === "*" || character === "?")
				? character
				: `\\${character}`,
		)
		.trim();
	return mode === "prefix" && literal ? `${literal}*` : literal;
}

export function buildDbSearchQuery({ terms, mode, extended }: DbQuery) {
	const activeTerms = terms.filter(({ query }) => query.trim() !== "");
	if (activeTerms.length === 0) return { match_all: {} };

	const scoped = new Map<string, string[]>();
	const unscoped = new Set<string>();
	for (const { field, query } of activeTerms) {
		if (!field) unscoped.add(query);
		else {
			const group = scoped.get(field);
			if (group) group.push(query);
			else scoped.set(field, [query]);
		}
	}

	const columns = extended ? extendedSearchFields : allSearchFields;
	const scopedQueries = Array.from(scoped, ([field, queries]) => ({
		bool: {
			should: [...new Set(queries)].flatMap((query) =>
				expandedFields(field).map((searchField) => scopedSearch(searchField, query, mode)),
			),
			minimum_should_match: 1,
		},
	}));

	if (unscoped.size === 0) return { bool: { must: scopedQueries } };

	if (mode === "fuzzy") {
		const allQueries = Array.from(unscoped, (query) => ({
			multi_match: { query, fields: columns, fuzziness: 3 },
		}));
		return { bool: { must: [...scopedQueries, ...allQueries] } };
	}

	const literals = Array.from(unscoped, (query) => queryStringTerm(query, mode)).filter(Boolean);
	const allQuery =
		literals.length > 0
			? { query_string: { query: literals.join(" OR "), fields: columns } }
			: { match_none: {} };
	return { bool: { must: [...scopedQueries, allQuery] } };
}
