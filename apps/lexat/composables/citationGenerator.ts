import type { DropdownOption } from "@/types/dropdown-option";
import type { BibliographyItem, BibliographyItemCreator } from "@/types/zotero";

export function useCitationGenerator() {
	const env = useRuntimeConfig();

	const collectionId = "5540614";

	const bibliographyItems = ref<Array<BibliographyItem>>([]);

	const formatAuthors = (creators: Array<BibliographyItemCreator>): string => {
		if (creators.length === 0) return "";
		if (creators.length === 1) {
			return `${creators[0].lastName}, ${creators[0].firstName}`;
		}

		const lastAuthor = creators[creators.length - 1];
		const otherAuthors = creators.slice(0, -1);

		return `${otherAuthors
			.map((creator) => `${creator.lastName}, ${creator.firstName}`)
			.join(", ")} & ${lastAuthor.lastName}, ${lastAuthor.firstName}`;
	};

	const fetchBibliographyItems = async () => {
		const result = await $fetch<Array<{ data: BibliographyItem }>>(
			`/groups/${collectionId}/items`,
			{
				baseURL: env.public.zoteroBaseUrl,
				method: "GET",
			},
		);
		if (result.length) {
			bibliographyItems.value = result.map((i) => i.data).filter((i) => i.itemType !== "note");
		}
	};

	const generateCitation = (item: BibliographyItem): string => {
		const authors = formatAuthors(item.creators);
		const pages = item.pages ? `, ${item.pages}` : "";

		switch (item.itemType) {
			case "journalArticle":
				return `${authors}. ${item.date}. ${item.title}. ${item.publicationTitle ? `<em>${item.publicationTitle}</em>` : ""} ${item.volume}${pages}. ${item.doi ? `https://doi.org/${item.doi}` : ""}.`;

			case "bookSection":
				return `${authors}. ${item.date}. ${item.title}. ${item.bookTitle ? `In <em>${item.bookTitle}</em>${pages}. ` : ""}${item.place}:${item.publisher}.`;

			case "book":
				return `${authors}. ${item.date}. <em>${item.title}</em>. ${item.place}:${item.publisher}.`;

			case "thesis":
				return `${authors}. ${item.date}. <em>${item.title}</em>. ${item.university ? item.university : ""}.`;
			case "note":
			default:
				return "";
		}
	};

	const getCitation = (key: string): string => {
		const item = bibliographyItems.value.find((item) => item.key === key);
		if (!item) return "";

		return generateCitation(item);
	};

	const bibliographyOptions: ComputedRef<Array<DropdownOption>> = computed(() => {
		return bibliographyItems.value.map((i) => ({
			value: i.key,
			label: truncateString(i.title, 60),
		}));
	});

	return {
		bibliographyItems,
		bibliographyOptions,
		fetchBibliographyItems,
		getCitation,
	};
}
