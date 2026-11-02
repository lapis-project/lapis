import { computed } from "vue";

import type { SearchParams } from "@/types/api";

const filterTagLabels: Record<string, string> = {
	word: "Wortform",
	query: "Suche",
	lemma: "Lemma",
	pos: "POS",
	feats: "Merkmale",
	gender: "Geschlecht",
	transcript_name: "Transkriptname",
	instance_id: "Transkript ID",
	projects: "Projekt",
	settings: "Setting",
	locations: "Ort",
	state: "Bundesland",
	dialect_competence: "Dialektkompetenz",
	standard_competence: "Standardkompetenz",
	age_lower: "Altersgruppe",
	age_upper: "Altersgruppe",
	has_bkms: "BKMS",
};

const filterKeys = Object.keys(filterTagLabels);

export function useActiveFilterTags() {
	const route = useRoute();
	const router = useRouter();

	// All API filter parameters derived from the URL.
	const filterParams = computed<SearchParams>(() => {
		const q = route.query;

		return {
			word: q.word ? String(q.word) : undefined,
			query: q.query ? String(q.query) : undefined,
			lemma: q.lemma ? String(q.lemma) : undefined,
			pos: q.pos ? String(q.pos) : undefined,
			mode: (q.mode as "simple" | "regex") ?? "simple",
			feats: q.feats ? String(q.feats) : undefined,
			fromp: (q.fromp as string) ?? "1",
			pagesize: "50",
			locations: q.locations != null ? [Number(q.locations)] : undefined,
			state: q.state ? Number(q.state) : undefined,
			gender: q.gender ? String(q.gender) : undefined,
			dialect_competence: q.dialect_competence ? Number(q.dialect_competence) : undefined,
			standard_competence: q.standard_competence ? Number(q.standard_competence) : undefined,
			age_lower: q.age_lower ? Number(q.age_lower) : undefined,
			age_upper: q.age_upper ? Number(q.age_upper) : undefined,
			projects: q.projects != null ? [Number(q.projects)] : undefined,
			settings: q.settings != null ? [Number(q.settings)] : undefined,
			transcript_name: q.transcript_name ? String(q.transcript_name) : undefined,
			has_bkms: q.has_bkms === "true",
		};
	});

	const activeFilterTagEntries = computed(() => {
		const entries: Array<{ key: string; label: string; value: string }> = [];
		const hasAgeFilter = route.query.age_lower != null || route.query.age_upper != null;

		if (hasAgeFilter) {
			entries.push({
				key: "age_group",
				label: "Altersgruppe",
				value: "age_group",
			});
		}

		for (const [key, label] of Object.entries(filterTagLabels)) {
			if (key === "age_lower" || key === "age_upper") continue;

			const raw = route.query[key];
			if (raw == null || raw === "") continue;

			const values = (Array.isArray(raw) ? raw : [raw]).filter(
				(value): value is string => typeof value === "string" && value !== "",
			);

			for (const value of values) {
				if (key !== "has_bkms" || value === "true") {
					entries.push({ key, label, value });
				}
			}
		}

		return entries;
	});

	const activeFilterCount = computed(() => activeFilterTagEntries.value.length);

	function removeFilterTag(key: string, value?: string) {
		const nextQuery = { ...route.query };
		const current = nextQuery[key];

		if (key === "age_group" || key === "age_lower" || key === "age_upper") {
			delete nextQuery.age_lower;
			delete nextQuery.age_upper;
			return router.replace({ query: nextQuery });
		}

		if (Array.isArray(current) && value !== undefined) {
			const remaining = current.filter((item) => item !== value);

			if (remaining.length > 0) {
				nextQuery[key] = remaining;
			} else {
				delete nextQuery[key];
			}
		} else {
			delete nextQuery[key];
		}

		if (!nextQuery.lemma && !nextQuery.word && !nextQuery.pos) {
			delete nextQuery.mode;
			delete nextQuery.page;
			delete nextQuery.fromp;
		}

		return router.replace({ query: nextQuery });
	}

	function clearAllFilterTags() {
		const nextQuery = { ...route.query };

		for (const key of filterKeys) {
			delete nextQuery[key];
		}

		return router.replace({ query: nextQuery });
	}

	const hasKwicSearch = computed(() => {
		const q = route.query;

		return Boolean(q.word || q.query || q.lemma || q.pos || q.feats || q.comment_search || q.mode);
	});

	return {
		filterParams,
		activeFilterTagEntries,
		activeFilterCount,
		hasKwicSearch,
		removeFilterTag,
		clearAllFilterTags,
	};
}
