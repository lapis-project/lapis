/** Lower-cases and strips diacritics, so "mutze" finds "Mütze" and "e" finds "ē". */
export function normaliseSearch(value: string) {
	return value
		.normalize("NFD")
		.replace(/\p{Diacritic}/gu, "")
		.toLocaleLowerCase()
		.trim();
}

/** Every whitespace-separated term of the query has to occur in one of the values. */
export function matchesSearch(values: Array<string | undefined>, query: string) {
	const terms = normaliseSearch(query).split(/\s+/).filter(Boolean);
	if (terms.length === 0) return true;
	const haystack = normaliseSearch(values.filter((value) => value !== undefined).join(" "));
	return terms.every((term) => haystack.includes(term));
}
