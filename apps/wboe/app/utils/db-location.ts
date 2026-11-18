import { dbColumns } from "#shared/utils/db-records";
import type { DbSearchTerm } from "#shared/utils/db-search";

const searchFields = new Set(dbColumns.flatMap(({ searchField }) => searchField ?? []));

function readTerms(value: unknown): DbSearchTerm[] {
	if (typeof value !== "string" || !value) return [];
	if (value.startsWith("[")) {
		try {
			const terms: unknown = JSON.parse(value);
			return Array.isArray(terms) ? terms : [];
		} catch {
			return [];
		}
	}
	return value.split(";").map((segment) => {
		const [field, query = ""] = segment.split(",");
		return { field: field === "all_fields" ? undefined : field, query };
	});
}

export function readDbTerms(value: unknown) {
	return readTerms(value).flatMap((term) => {
		if (!term || typeof term.query !== "string" || !term.query.trim()) return [];
		return [
			{
				query: term.query,
				field: term.field && searchFields.has(term.field) ? term.field : undefined,
			},
		];
	});
}

export function writeDbTerms(value: DbSearchTerm[]) {
	const terms = value.flatMap(({ query, field }) => {
		const text = query.trim();
		return text ? [{ query: text, field }] : [];
	});
	if (!terms.length) return undefined;
	if (terms.some(({ query }) => /[,;]/u.test(query))) return JSON.stringify(terms);
	return terms.map(({ field, query }) => `${field || "all_fields"},${query},`).join(";");
}
