<script lang="ts" setup>
import type { InferResponseType } from "hono/client";
import { ArrowLeft, InfoIcon, Trash, UploadIcon, WandSparkles } from "lucide-vue-next";
import { toast } from "vue-sonner";

import { useApiClient } from "@/composables/use-api-client";
import type { DropdownOption } from "@/types/dropdown-option";
import type { BibliographyItem } from "@/types/zotero";

definePageMeta({
	middleware: ["protected"],
});

const env = useRuntimeConfig();
const route = useRoute();
const { apiClient } = useApiClient();

const _getInformationList = apiClient.cms.articles.create.info.$get;
type APIInformationList = InferResponseType<typeof _getInformationList, 200>;
const _getAdminArticle = apiClient.cms.articles[":id"].$get;
type APIAdminArticle = InferResponseType<typeof _getAdminArticle, 200>;

const { bibliographyItems, bibliographyOptions, fetchBibliographyItems } = useCitationGenerator();
const { statusOptions } = useArticleStatus();

if (!bibliographyItems.value.length) {
	await fetchBibliographyItems();
}

const currentLocale = useLocale();

const t = useTranslations();
const localePath = useLocalePath();

const routeId = Array.isArray(route.params.id) ? route.params.id[0] : route.params.id;

const abstract = ref<string>("");
const activeStatus = ref<Status>("Draft");
const alias = ref<string>("");
const postId = ref<number | null>(null);
const content = ref<string>("<p>Beispieltext</p>");
const cover = ref<string>("");
const coverAlt = ref<string>("");
const citation = ref<string>("");
const languageOptions = [
	{ value: "en", label: t("LocaleSwitcher.english") },
	{ value: "de", label: t("LocaleSwitcher.german") },
];
const selectedAuthors = ref<Array<string>>([]);
const selectedCategory = ref<string | null>(null);
const selectedLanguage = ref<"de" | "en">(currentLocale.value);
const selectedQuestion = ref<string | null>(null);
const selectedBibliographyItems = ref<Array<BibliographyItem>>([]);
const title = ref<string>("");

const { data: informationList } = await useFetch<APIInformationList>("/cms/articles/create/info", {
	baseURL: env.public.apiBaseUrl,
	method: "GET",
	credentials: "include",
});

const categoryOptions = ref<Array<DropdownOption>>([]);
const mappedQuestions = ref<Array<DropdownOption>>([]);
const users = ref<Array<{ id: number; value: number; firstName: string; lastName: string }>>([]);

if (informationList.value) {
	categoryOptions.value = informationList.value.categories.map((c) => ({
		id: c.id,
		value: c.name,
		label: t(`AdminPage.editor.category.${c.name}`),
	}));
	mappedQuestions.value = informationList.value.phenomenon.map((c) => ({
		id: c.id,
		value: c.name,
		label: c.name,
	}));
	users.value = informationList.value.authors;
}

if (routeId && routeId !== "new") {
	const { data, error } = await useFetch<APIAdminArticle>(`/cms/articles/${routeId}`, {
		baseURL: env.public.apiBaseUrl,
		method: "GET",
		credentials: "include",
	});

	if (error.value) {
		console.error("Failed to fetch article:", error.value);
	} else if (data.value && data.value.article) {
		// Populate properties with API data
		const article = data.value.article;
		const articleBibliography = article.bibliography.map((b) => b.name);
		abstract.value = article.abstract ?? "";
		alias.value = article.alias ?? "";
		content.value = article.content ?? "";
		cover.value = article.cover ?? "";
		coverAlt.value = article.cover_alt ?? "";
		citation.value = article.citation ?? "";
		title.value = article.title ?? "";
		selectedAuthors.value = article.authors.map(
			(author) => `${author.firstname} ${author.lastname}`,
		);
		selectedCategory.value = article.post_type_name;
		selectedLanguage.value = article.lang ?? "de";
		selectedBibliographyItems.value = bibliographyItems.value.filter((b) =>
			articleBibliography.includes(b.key),
		);
		selectedQuestion.value = article.phenomenon?.[0]?.name ?? null;
		postId.value = article.post_id;
		activeStatus.value = article.post_status ?? "Draft";
	} else {
		postId.value = parseInt(routeId);
	}
}

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

const authorsOptions = computed(
	(): Array<DropdownOption & { firstName: string; lastName: string }> => {
		return (
			users.value?.map((user) => ({
				label: `${user.firstName} ${user.lastName}`,
				value: user.value.toString(),
				id: user.id,
				firstName: user.firstName,
				lastName: user.lastName,
			})) ?? []
		);
	},
);

const saveArticle = async () => {
	const authors = selectedAuthors.value.map(
		(a) => authorsOptions.value.find((o) => o.label === a)?.id,
	);
	const article: {
		title: string;
		alias: string;
		// cover: string; // done via mediaHandler.ts
		cover_alt: string;
		abstract: string;
		content: string;
		category: string;
		authors: Array<number | undefined>;
		bibliography: Array<string>;
		status: string;
		lang: "de" | "en";
		citation: string;
		projectId: Array<number>;
		phenomenonId?: number;
	} = {
		title: title.value,
		alias: alias.value,
		cover_alt: coverAlt.value,
		abstract: abstract.value,
		content: content.value,
		category: selectedCategory.value ?? "",
		authors,
		bibliography: selectedBibliographyItems.value?.map((q) => q.key),
		status: activeStatus.value,
		lang: selectedLanguage.value,
		citation: citation.value,
		projectId: [1],
	};

	if (selectedQuestion.value) {
		article["phenomenonId"] = Number(
			mappedQuestions.value?.find((q) => q.value === selectedQuestion.value)?.id,
		);
	}

	try {
		const apiRoute = `/cms/articles/${postId.value}`;
		const response = await $fetch(apiRoute, {
			baseURL: env.public.apiBaseUrl,
			method: "PUT",
			body: article,
			credentials: "include",
		});
		toast.success(t("AdminPage.editor.saving_succeeded.title"));
		if (response) {
			await navigateTo(localePath("/admin/articles"));
		}
	} catch (error) {
		console.error(error);
		toast.error(t("AdminPage.editor.saving_failed.title"));
	}
};

const generateCitation = () => {
	// Filter the authors that are selected
	const filteredAuthors = authorsOptions.value.filter((author) =>
		selectedAuthors.value.includes(author.label!),
	);

	// Map the authors to the "<lastName>, <firstName>" format
	const authorNames = filteredAuthors.map((author) => `${author.lastName}, ${author.firstName}`);

	// Join the authors with "/" for all but the last pair, and "&" for the last pair
	let authorsString = "";
	if (authorNames.length > 1) {
		authorsString = `${authorNames.slice(0, -1).join(" / ")} & ${authorNames[authorNames.length - 1]}`;
	} else if (authorNames.length === 1) {
		authorsString = authorNames[0] ?? "";
	}

	// Construct the citation string
	const year = new Date().getFullYear(); // Get the current year dynamically
	const url = `${baseURL}${selectedLanguage.value}/article/${alias.value}`;

	citation.value = `${authorsString} (${year.toString()}): ${title.value}, In: LexAT21: Atlas zur lexikalischen Variation in Österreich im 21. Jahrhundert. Herausgegeben von Alexandra N. Lenz. [URL: ${url}].`;
};

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

const handleFileChange = async (event: Event) => {
	const file = (event.target as HTMLInputElement)?.files?.[0]; // Get the selected file
	if (file) {
		const formData = new FormData();
		formData.append("image", file);
		try {
			// TODO rewrite mediaHandler to new syntax and then refactor reponse type here
			const result = await $fetch<{ url: string; message: string }>(`/media/upload/${routeId}`, {
				baseURL: env.public.apiBaseUrl,
				credentials: "include",
				body: formData,
				method: "POST",
			});
			// DEBUG
			// const result = {
			// 	url: "https://images.pexels.com/photos/934055/pexels-photo-934055.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
			// };
			cover.value = result.imageUrl;
			toast.success(t("AdminPage.editor.cover.upload_succeeded"));
		} catch (error) {
			console.error(error);
			toast.error(t("AdminPage.editor.cover.upload_failed"));
		}
	}
};

watch(title, (newValue) => {
	alias.value = generateAlias(newValue);
});

watch(selectedCategory, (newValue) => {
	if (newValue !== "commentary") {
		selectedQuestion.value = null;
	}
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
					<h3 class="text-3xl font-semibold">{{ title || "Untitled" }}</h3>
					<p v-if="postId" class="text-foreground/70">ID: {{ postId }}</p>
				</div>
				<div class="flex items-center gap-3">
					<Label class="sr-only" for="status">{{ t("AdminPage.editor.status.status") }}</Label>
					<Combobox id="status" v-model="activeStatus" :options="statusOptions" width="w-44" />
					<Button @click="saveArticle">Save</Button>
				</div>
			</div>
			<div class="bg-background">
				<div class="mb-6 flex flex-col gap-5 md:flex-row">
					<div class="w-full max-w-xl space-y-5 md:w-1/2">
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
					<div class="w-full max-w-xl space-y-5 md:w-1/2">
						<div class="grid items-center gap-1.5">
							<div
								class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
							>
								{{ t("AdminPage.editor.cover.label")
								}}<span class="text-destructive"> (Try to keep image below 500kb for now)</span>
							</div>
							<label
								class="flex aspect-16/9 w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-700 dark:hover:border-gray-500 dark:hover:bg-gray-800"
								for="dropzone-file"
							>
								<div v-if="!cover" class="flex flex-col items-center justify-center pb-6 pt-5">
									<UploadIcon class="mb-4 size-8 text-gray-500 dark:text-gray-400" />

									<p class="mb-2 text-sm text-gray-500 dark:text-gray-400">
										<span class="font-semibold">{{
											t("AdminPage.editor.cover.click_to_upload")
										}}</span>
									</p>
									<p class="text-xs text-gray-500 dark:text-gray-400">PNG, JPG (IDEALLY 16:9)</p>
								</div>
								<NuxtImg v-else class="size-full object-cover" :src="cover"></NuxtImg>
								<input
									id="dropzone-file"
									accept="image/png, image/jpeg"
									class="hidden"
									type="file"
									@change="handleFileChange"
								/>
							</label>
						</div>
						<div class="grid w-full items-center gap-1.5">
							<Label for="coverAlt">{{ t("AdminPage.editor.cover_alt.label") }}</Label>
							<Input
								id="coverAlt"
								v-model="coverAlt"
								:placeholder="t('AdminPage.editor.cover_alt.placeholder')"
								type="text"
							/>
						</div>
					</div>
				</div>

				<div class="mb-6 grid w-full items-center gap-1.5">
					<Label for="content">{{ t("AdminPage.editor.content") }}</Label>
					<ClientOnly>
						<TextEditor v-model="content" class="w-full" />
					</ClientOnly>
					<!-- DEBUG CONTENT <p>{{ content }}</p> -->
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

					<div
						v-if="
							(selectedCategory === 'commentary' || selectedCategory === 'short_description') &&
							mappedQuestions
						"
						class="grid max-w-sm items-center gap-1.5"
					>
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
						<Label for="bibliography"
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
								<span class="grow overflow-hidden rounded-lg border px-2 py-0.5"
									>{{ truncateString(item.title, 60) }} ({{ item.date }})</span
								>

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
	</MainContent>
</template>
