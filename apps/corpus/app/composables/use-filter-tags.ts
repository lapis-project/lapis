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
	age_lower: "Alter von",
	age_upper: "Alter bis",
	has_bkms: "BKMS",
};

// Query parameters managed by this composable.
// Add any other filter keys your app uses.
const filterKeys = Object.keys(filterTagLabels);

export function useActiveFilterTags() {
	const route = useRoute();
	const router = useRouter();

	const activeFilterTagEntries = computed(() =>
		Object.entries(filterTagLabels).flatMap(([key, label]) => {
			const raw = route.query[key];

			if (raw == null || raw === "") return [];

			const values = (Array.isArray(raw) ? raw : [raw]).filter(
				(value): value is string => typeof value === "string" && value !== "",
			);

			return values
				.filter((value) => key !== "has_bkms" || value === "true")
				.map((value) => ({ key, label, value }));
		}),
	);

	const activeFilterCount = computed(() => activeFilterTagEntries.value.length);

	function removeFilterTag(key: string, value?: string) {
		const nextQuery = { ...route.query };
		const current = nextQuery[key];

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

		// Age bounds form one logical filter.
		if (key === "age_lower" || key === "age_upper") {
			delete nextQuery.age_lower;
			delete nextQuery.age_upper;
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
