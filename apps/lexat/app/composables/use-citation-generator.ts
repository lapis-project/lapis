import { StorageSerializers } from "@vueuse/core";

import type { DropdownOption } from "@/types/dropdown-option";
import type { BibliographyItem } from "@/types/zotero";

export function useCitationGenerator() {
	const env = useRuntimeConfig();

	const collectionId = "5540614";

	const bibliographyItems = ref<Array<BibliographyItem>>([]);

	const fetchBibliographyItems = async (keyList: string | null = null) => {
		const cached = useSessionStorage<Array<BibliographyItem> | null>("bibliography", null, {
			serializer: StorageSerializers.object,
		});

		// only refetch if cache is empty, or if we're asking for specific keys
		if (!cached.value || keyList) {
			let items: Array<BibliographyItem> = [];

			if (keyList) {
				// single fetch by keyList
				const result = await $fetch<Array<{ data: BibliographyItem }>>(
					`/groups/${collectionId}/items`,
					{
						query: { limit: 100, itemKey: keyList },
						baseURL: env.public.zoteroBaseUrl,
						method: "GET",
					},
				);
				items = result.map((i) => i.data).filter((i) => i.itemType !== "note");
			} else {
				// full‐collection fetch, two pages of 100 each
				const [page1, page2] = await Promise.all([
					$fetch<Array<{ data: BibliographyItem }>>(`/groups/${collectionId}/items`, {
						query: { limit: 100, start: 0 },
						baseURL: env.public.zoteroBaseUrl,
						method: "GET",
					}),
					$fetch<Array<{ data: BibliographyItem }>>(`/groups/${collectionId}/items`, {
						query: { limit: 100, start: 100 },
						baseURL: env.public.zoteroBaseUrl,
						method: "GET",
					}),
				]);

				const parse = (arr: Array<{ data: BibliographyItem }>) =>
					arr.map((i) => i.data).filter((i) => i.itemType !== "note");

				items = [...parse(page1), ...parse(page2)];
				// cache the full list
				cached.value = items;
			}

			bibliographyItems.value = items;
		} else {
			// serve from cache
			bibliographyItems.value = cached.value;
		}
	};

	const getCitationItems = (keys: Array<string>) => {
		const sanitizedKeys = new Set(keys); // in case of duplicate items
		return bibliographyItems.value
			.filter((item) => sanitizedKeys.has(item.key))
			.map((item) => item.extra) // take the “extra” field
			.sort(
				(a, b) => a.localeCompare(b, "de", { sensitivity: "base" }), // locale-aware alphabetical sort
			);
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
		getCitationItems,
	};
}
