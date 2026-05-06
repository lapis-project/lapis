import { StorageSerializers } from "@vueuse/core";
import type { InferResponseType } from "hono/client";

import type { DropdownOption } from "@/types/dropdown-option";
import type { BibliographyItem } from "@/types/zotero";

export function useCitationGenerator() {
	const env = useRuntimeConfig();

	const bibliographyItems = ref<Array<BibliographyItem>>([]);

	const { apiClient } = useApiClient();
	const _getBibliography = apiClient.bib.$get;
	type APIBibliography = InferResponseType<typeof _getBibliography, 200>;

	const fetchBibliographyItems = async () => {
		const cached = useSessionStorage<Array<BibliographyItem> | null>("bibliography", null, {
			serializer: StorageSerializers.object,
		});

		// only refetch if cache is empty, or if we're asking for specific keys
		if (!cached.value) {
			let items: Array<BibliographyItem> = [];
			const { data } = await useFetch<APIBibliography>("bib", {
				query: {
					page: 1,
					pageSize: 300,
				},
				baseURL: env.public.apiBaseUrl,
				method: "GET",
				credentials: "include",
			});

			const parse = (arr: APIBibliography["data"]) =>
				arr
					// 1. Dig two levels deep to get the pure bibliography data object
					.map((i) => i.data.data)
					// 2. Filter out the notes (and fix the previous .date typo!)
					.filter((innerData) => innerData.itemType !== "note");

			if (data.value) {
				items = parse(data.value.data) as Array<BibliographyItem>;
				// cache the full list
				cached.value = items;
			}

			bibliographyItems.value = items;
		} else {
			// serve from cache
			bibliographyItems.value = cached.value;
		}
	};

	const bibliographyOptions: ComputedRef<Array<DropdownOption>> = computed(() => {
		return bibliographyItems.value.map((i) => ({
			value: i.key,
			label: `${truncateString(i.title, 60)} (${i.date})`,
		}));
	});

	return {
		bibliographyItems,
		bibliographyOptions,
		fetchBibliographyItems,
	};
}
