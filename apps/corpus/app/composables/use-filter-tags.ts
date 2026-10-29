import { computed } from "vue";

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

// Query parameters managed by this composable.
// Add any other filter keys your app uses.
const filterKeys = Object.keys(filterTagLabels);

export function useActiveFilterTags() {
	const route = useRoute();
	const router = useRouter();

	const activeFilterTagEntries = computed(() => {
		const entries: Array<{ key: string; label: string; value: string }> = [];
		const hasAgeFilter = route.query.age_lower != null || route.query.age_upper != null;

		if (hasAgeFilter) {
			entries.push({ key: "age_group", label: "Altersgruppe", value: "age_group" });
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

		// Reset mode and page when no search terms remain.
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

	return {
		activeFilterTagEntries,
		activeFilterCount,
		removeFilterTag,
		clearAllFilterTags,
	};
}
