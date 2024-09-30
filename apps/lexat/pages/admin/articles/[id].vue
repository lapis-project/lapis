<script lang="ts" setup>
import { ArrowLeft, InfoIcon, Trash, WandSparkles } from "lucide-vue-next";

import { useToast } from "@/components/ui/toast/use-toast";
import type { DropdownOption } from "@/types/dropdown-option";
import type { BibliographyItem } from "@/types/zotero";

const env = useRuntimeConfig();

const currentLocale = useLocale();

const { toast } = useToast();

const t = useTranslations();

const { data: categoryOptions } = await useFetch<Array<DropdownOption>>(`/api/categories`, {
	method: "GET",
});

const { data: users } = await useFetch(`/api/users`, {
	method: "GET",
});

const { data: questions } = await useFetch<
	Array<{ id: number; phenomenon_name: string; description: string | null }>
>("/questions/survey/1", {
	baseURL: env.public.apiBaseUrl,
	method: "GET",
});

const mappedQuestions = computed(() => {
	return (
		questions.value?.map((q) => ({
			id: q.id,
			value: q.id.toString(),
			label: q.phenomenon_name,
		})) ?? null
	);
});

const abstract = ref<string>("");
const alias = ref<string>("");
const bibliographyItems = ref<Array<BibliographyItem>>([]);
const collectionId = "5540614";
const content = ref<string>("<p>Hello Tiptap</p>");
const citation = ref<string>("");
const languageOptions = [
	{ value: "en", label: t("AdminPage.editor.language.english") },
	{ value: "de", label: t("AdminPage.editor.language.german") },
];
const selectedAuthors = ref<Array<string>>([]);
const selectedCategory = ref<string | null>(null);
const selectedLanguage = ref<"de" | "en">(currentLocale.value);
const selectedQuestion = ref<string | null>(null);
const selectedBibliographyItems = ref<Array<BibliographyItem>>([]);
const title = ref<string>("");

const baseURL = "https://lexat.acdh-ch-dev.oeaw.ac.at/";

const generateAlias = (title: string) => {
	return title
		.toLowerCase()
		.replace(/ä/gi, "ae")
		.replace(/ö/gi, "oe")
		.replace(/ü/gi, "ue")
		.replace(/ß/g, "ss")
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "");
};

const saveArticle = () => {
	// const article = {
	// 	abstract: abstract.value,
	// 	alias: alias.value,
	// 	content: content.value,
	// 	title: title.value,
	// 	category: selectedCategory.value,
	// 	phenomenonId: selectedQuestion.value,
	// 	bibliographyItems: selectedBibliographyItems.value?.map((q) => q.key),
	// 	language: selectedLanguage.value,
	// };
	toast({
		title: "Article Saved",
		description: "Your changes have successfully been saved.",
	});
};

const generateCitation = () => {
	// Filter the authors that are selected
	const filteredAuthors = authorsOptions.value.filter((author) =>
		selectedAuthors.value.includes(author.label),
	);

	// Map the authors to the "<lastName>, <firstName>" format
	const authorNames = filteredAuthors.map((author) => `${author.lastName}, ${author.firstName}`);

	// Join the authors with commas and handle the last author with "and" if needed
	let authorsString = "";
	if (authorNames.length > 1) {
		authorsString = `${authorNames.slice(0, -1).join(", ")} / ${authorNames[authorNames.length - 1]}`;
	} else if (authorNames.length === 1) {
		authorsString = authorNames[0] ?? "";
	}

	// Construct the citation string
	const year = new Date().getFullYear(); // Get the current year dynamically
	const url = `${baseURL}${selectedLanguage.value}/article/${alias.value}`;

	citation.value = `${authorsString} (${year.toString()}): ${title.value}, In: LexAT. [URL: ${url}].`;
};

const fetchBibliographyItems = async () => {
	const result = await $fetch(`/groups/${collectionId}/items`, {
		baseURL: env.public.zoteroBaseUrl,
		method: "GET",
	});
	if (result) {
		bibliographyItems.value = result.map((i) => i.data).filter((i) => i.itemType !== "note");
	}
};

const bibliographyOptions: ComputedRef<Array<DropdownOption>> = computed(() => {
	return bibliographyItems.value.map((i) => ({
		value: i.key,
		label: truncateString(i.title, 60),
	}));
});

const addBibliographyItem = (value: string) => {
	const alreadySelected = Boolean(selectedBibliographyItems.value.some((i) => i.key === value));
	if (alreadySelected) {
		return;
	}
	const itemToAdd = bibliographyItems.value.find((i) => i.key === value);
	if (itemToAdd) {
		selectedBibliographyItems.value.push(itemToAdd);
	}
};

const removeBibliographyItem = (key: string) => {
	selectedBibliographyItems.value = selectedBibliographyItems.value.filter((i) => i.key !== key);
};

onMounted(async () => {
	if (!bibliographyItems.value.length) {
		await fetchBibliographyItems();
	}
});

export type Status = "draft" | "published" | "ready" | "unpublished";

const activeStatus = ref<Status>("draft");

// color palette reference: https://www.color-hex.com/color-palette/35021
const statusOptions: Array<DropdownOption<Status>> = [
	{
		value: "draft",
		label: t("AdminPage.editor.status.draft"),
		color: "#cc3232", // red
	},
	{
		value: "ready",
		label: t("AdminPage.editor.status.ready"),
		color: "#e7b416", // yellow
	},
	{
		value: "published",
		label: t("AdminPage.editor.status.published"),
		color: "#2dc937", // green
	},
	{
		value: "unpublished",
		label: t("AdminPage.editor.status.unpublished"),
		color: "#d3d3d3", // grey
	},
];

const authorsOptions = computed(
	(): Array<DropdownOption & { firstName: string; lastName: string }> => {
		return (
			users.value?.map((u) => ({
				value: u.id.toString(),
				label: nameShortener(u.firstName, u.lastName),
				...u,
			})) ?? []
		);
	},
);

watch(title, (newValue) => {
	alias.value = generateAlias(newValue);
});

usePageMetadata({
	title: t("AdminPage.meta.title"),
});
</script>

<template>
	<MainContent class="container w-full content-start py-8">
		<PageTitle class="sr-only">{{ t("AdminPage.title") }}</PageTitle>
		<div class="col-span-4 rounded border p-8">
			<NuxtLinkLocale class="mb-4 inline-flex items-center gap-1" to="/admin/articles"
				><ArrowLeft class="size-4" />Back</NuxtLinkLocale
			>
			<div class="mb-8 flex justify-between border-b pb-8">
				<div>
					<h3 class="text-3xl font-semibold">Untitled</h3>
					<p class="text-foreground/70">ID: 1231231</p>
				</div>
				<div class="flex items-center gap-3">
					<Label class="sr-only" for="status">{{ t("AdminPage.editor.status.status") }}</Label>
					<Combobox id="status" v-model="activeStatus" :options="statusOptions" width="w-44" />
					<Button @click="saveArticle">Save</Button>
				</div>
			</div>
			<div class="bg-background">
				<div class="mb-6 grid grid-cols-3 gap-5">
					<div class="grid w-full items-center gap-1.5">
						<Label for="title">{{ t("AdminPage.editor.title") }}</Label>
						<Input
							id="title"
							v-model="title"
							:placeholder="t('AdminPage.editor.title')"
							type="text"
						/>
					</div>
					<div class="grid w-full items-center gap-1.5">
						<Label class="flex items-center gap-1" for="alias"
							>{{ t("AdminPage.editor.alias.label") }}
							<InfoTooltip :content="t('AdminPage.editor.alias.tooltip')">
								<InfoIcon class="size-4"></InfoIcon> </InfoTooltip
						></Label>
						<Input
							id="alias"
							v-model="alias"
							:placeholder="t('AdminPage.editor.alias.placeholder')"
							type="text"
						/>
					</div>
				</div>
				<div class="mb-6 grid grid-cols-3 items-start gap-5">
					<div class="grid w-full gap-1.5">
						<Label for="abstract">{{ t("AdminPage.editor.abstract") }}</Label>
						<Textarea
							id="abstract"
							v-model="abstract"
							:placeholder="t('AdminPage.editor.abstract')"
							type="text"
						/>
					</div>
					<div v-if="languageOptions" class="grid items-center gap-1.5">
						<Label for="language">{{ t("AdminPage.editor.language.label") }}</Label>
						<Combobox
							id="language"
							v-model="selectedLanguage"
							:options="languageOptions"
							:placeholder="t('AdminPage.editor.language.placeholder')"
						/>
					</div>
				</div>
				<div class="mb-6 grid w-full items-center gap-1.5">
					<Label for="content">{{ t("AdminPage.editor.content") }}</Label>
					<ClientOnly>
						<TextEditor v-model="content" class="w-full" />
					</ClientOnly>
				</div>
				<div class="mb-6 flex items-baseline gap-8">
					<div v-if="categoryOptions" class="grid max-w-sm items-center gap-1.5">
						<Label for="category">{{ t("AdminPage.editor.category.label") }}</Label>
						<Combobox
							id="category"
							v-model="selectedCategory"
							:options="categoryOptions"
							:placeholder="t('AdminPage.editor.category.placeholder')"
						/>
					</div>

					<div v-if="mappedQuestions" class="grid max-w-sm items-center gap-1.5">
						<Label for="phenomenon">{{ t("AdminPage.editor.question.label") }}</Label>
						<Combobox
							id="phenomenon"
							v-model="selectedQuestion"
							has-search
							:options="mappedQuestions"
							:placeholder="t('AdminPage.editor.question.placeholder')"
						/>
					</div>
				</div>
				<div v-if="authorsOptions" class="mb-6 grid w-full max-w-xl items-center gap-1.5">
					<Label for="authors">{{ t("AdminPage.editor.authors.label") }}</Label>
					<TagsCombobox
						id="authors"
						v-model="selectedAuthors"
						moveable
						:options="authorsOptions"
						:placeholder="t('AdminPage.editor.authors.placeholder')"
					/>
				</div>
				<div class="mb-6 flex w-full items-start gap-4">
					<div class="grid w-1/2 gap-1.5">
						<Label for="citation">{{ t("AdminPage.editor.citation.label") }}</Label>
						<Textarea
							id="citation"
							v-model="citation"
							:placeholder="t('AdminPage.editor.citation.placeholder')"
							type="text"
						/>
						<div class="flex w-full justify-end gap-1.5">
							<Button variant="outline" @click="generateCitation"
								><WandSparkles class="mr-2 size-4" />{{
									t("AdminPage.editor.citation.generate")
								}}</Button
							>
							<CopyToClipboard :text="citation" />
						</div>
					</div>
				</div>
				<div class="grid grid-cols-2 gap-5">
					<div class="mb-6 grid gap-4">
						<Label for="content"
							>{{ t("AdminPage.editor.bibliography.label")
							}}<template v-if="selectedBibliographyItems.length">
								({{ selectedBibliographyItems.length }})</template
							></Label
						>
						<Combobox
							has-search
							:options="bibliographyOptions"
							:placeholder="t('AdminPage.editor.bibliography.placeholder')"
							select-only
							width="w-80"
							@selected="addBibliographyItem"
						/>
						<ul v-if="selectedBibliographyItems.length" class="space-y-2">
							<li
								v-for="item in selectedBibliographyItems"
								:key="item.key"
								class="flex items-center gap-2"
							>
								<span class="line-clamp-1 grow overflow-hidden rounded-lg border px-2 py-0.5">{{
									item.title
								}}</span>
								<div>
									<Trash
										class="size-5 cursor-pointer hover:text-accent-foreground"
										@click="removeBibliographyItem(item.key)"
									></Trash>
								</div>
							</li>
						</ul>
					</div>
					<div class="mb-6 grid gap-4"></div>
				</div>
			</div>
		</div>
		<Toaster />
	</MainContent>
</template>
