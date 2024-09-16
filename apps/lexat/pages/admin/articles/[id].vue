<script lang="ts" setup>
import { ArrowLeft, WandSparkles } from "lucide-vue-next";

import { useToast } from "@/components/ui/toast/use-toast";
import type { DropdownOption } from "@/types/dropdown-option";

const { toast } = useToast();

const t = useTranslations();

const { data: categoryOptions } = await useFetch<Array<DropdownOption>>(`/api/categories`, {
	method: "get",
});

const { data: users } = await useFetch(`/api/users`, {
	method: "get",
});

const { data: questions } = await useFetch<Array<DropdownOption>>(`/api/questions/survey/lexat`, {
	method: "get",
});

const abstract = ref<string>("");
const alias = ref<string>("");
const content = ref<string>("<p>Hello Tiptap</p>");
const citation = ref<string>("");
const selectedAuthors = ref<Array<string>>([]);
const selectedCategory = ref<string | null>(null);
const selectedLanguage = ref<"de" | "en">("de");
const selectedQuestion = ref<string | null>(null);
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
	// do something
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
		// eslint-disable-next-line @typescript-eslint/restrict-template-expressions
		authorsString = `${authorNames.slice(0, -1).join(", ")} / ${authorNames[authorNames.length - 1]}`;
	} else if (authorNames.length === 1) {
		authorsString = authorNames[0] ?? "";
	}

	// Construct the citation string
	const year = new Date().getFullYear(); // Get the current year dynamically
	const url = `${baseURL}${selectedLanguage.value}/article/${alias.value}`;

	citation.value = `${authorsString} (${year.toString()}): ${title.value}, In: LexAT. [URL: ${url}].`;
};

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
					<Label for="status" class="sr-only">{{ t("AdminPage.editor.status.status") }}</Label>
					<Combobox id="status" v-model="activeStatus" :options="statusOptions" width="w-44" />
					<Button @click="saveArticle">Save</Button>
				</div>
			</div>
			<div class="bg-background">
				<div class="mb-6 grid w-full max-w-sm items-center gap-1.5">
					<Label for="title">{{ t("AdminPage.editor.title") }}</Label>
					<Input
						id="title"
						v-model="title"
						type="text"
						:placeholder="t('AdminPage.editor.title')"
					/>
				</div>
				<div class="mb-6 grid w-full max-w-sm items-center gap-1.5">
					<Label for="alias">{{ t("AdminPage.editor.alias") }}</Label>
					<Input
						id="alias"
						v-model="alias"
						type="text"
						:placeholder="t('AdminPage.editor.alias')"
					/>
				</div>
				<div class="mb-6 grid w-full max-w-sm items-center gap-1.5">
					<Label for="abstract">{{ t("AdminPage.editor.abstract") }}</Label>
					<Textarea
						id="abstract"
						v-model="abstract"
						type="text"
						:placeholder="t('AdminPage.editor.abstract')"
					/>
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

					<div v-if="questions" class="grid max-w-sm items-center gap-1.5">
						<Label for="category">{{ t("AdminPage.editor.question.label") }}</Label>
						<Combobox
							v-model="selectedQuestion"
							:options="questions"
							:placeholder="t('AdminPage.editor.question.placeholder')"
							has-search
						/>
					</div>
				</div>
				<div v-if="authorsOptions" class="mb-6 grid w-full max-w-xl items-center gap-1.5">
					<Label for="authors">{{ t("AdminPage.editor.authors.label") }}</Label>
					<TagsCombobox
						id="authors"
						v-model="selectedAuthors"
						:options="authorsOptions"
						:placeholder="t('AdminPage.editor.authors.placeholder')"
						moveable
					/>
				</div>
				<div class="mb-6 flex w-full items-start gap-4">
					<div class="grid w-1/2 gap-1.5">
						<Label for="citation">{{ t("AdminPage.editor.citation.label") }}</Label>
						<Textarea
							id="citation"
							v-model="citation"
							type="text"
							:placeholder="t('AdminPage.editor.citation.placeholder')"
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
			</div>
		</div>
		<Toaster />
	</MainContent>
</template>
