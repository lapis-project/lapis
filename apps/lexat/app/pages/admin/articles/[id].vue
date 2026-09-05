<script lang="ts" setup>
import { UploadIcon } from "@lucide/vue";
import type { InferResponseType } from "hono/client";

import type { DropdownOption } from "@/types/dropdown-option";
import type { BibliographyItem } from "@/types/zotero";

definePageMeta({
	middleware: ["protected"],
});

const headers = useRequestHeaders(["cookie"]);
const env = useRuntimeConfig();
const route = useRoute();
const { apiClient } = useApiClient();
const toast = useToast();

const _getInformationList = apiClient.cms.articles.create.info.$get;
type APIInformationList = InferResponseType<typeof _getInformationList, 200>;
const _getAdminArticle = apiClient.cms.articles[":id"].$get;
type APIAdminArticle = InferResponseType<typeof _getAdminArticle, 200>;
const _uploadMedia = apiClient.media.upload.$post;
type APIMediaUploadResponse = InferResponseType<typeof _uploadMedia, 200>;

const { bibliographyItems, fetchBibliographyItems } = useCitationGenerator();
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
const selectedCategory = ref<string | undefined>(undefined);
const selectedLanguage = ref<"de" | "en">(currentLocale.value);
const selectedQuestion = ref<{ id: number; value: string; label: string } | undefined>(undefined);
const selectedBibliographyItems = ref<Array<BibliographyItem>>([]);
const selectedBibliographyKey = ref<string>();
const title = ref<string>("");

const { data: informationList } = await useFetch<APIInformationList>("/cms/articles/create/info", {
	baseURL: env.public.apiBaseUrl,
	method: "GET",
	credentials: "include",
	headers: headers,
});

const categoryOptions = ref<Array<{ value: string; label: string }>>([]);
const mappedQuestions = ref<Array<{ id: number; value: string | null; label: string | null }>>([]);
const users = ref<Array<{ id: number; value: number; firstName: string; lastName: string }>>([]);

if (informationList.value) {
	categoryOptions.value = informationList.value.categories.map((c) => ({
		value: c.name!,
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
		headers: headers,
	});

	if (error.value) {
		console.error("Failed to fetch article:", error.value);
	} else if (data.value?.article) {
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
		selectedQuestion.value =
			article.phenomenon?.map((p) => ({
				id: p.phenomenon_id,
				value: p.name,
				label: p.name,
			}))?.[0] ?? undefined;
		postId.value = article.post_id;
		activeStatus.value = article.post_status ?? "Draft";
	} else {
		postId.value = parseInt(routeId);
	}
}

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

const availableBibliographyOptions = computed(() => {
	const selectedKeys = new Set(selectedBibliographyItems.value.map((item) => item.key));

	return bibliographyItems.value
		.filter((item) => !selectedKeys.has(item.key))
		.map((item) => ({
			label: item.title,
			value: item.key,
			description: item.date || undefined,
		}));
});

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
			mappedQuestions.value?.find((q) => q.value === selectedQuestion.value?.value)?.id,
		);
	}

	try {
		const apiRoute = `/cms/articles/${postId.value}`;
		const response = await $fetch(apiRoute, {
			baseURL: env.public.apiBaseUrl,
			method: "PUT",
			body: article,
			credentials: "include",
			headers: headers,
		});
		if (response) {
			toast.add({ title: t("AdminPage.editor.saving_succeeded.title"), color: "success" });
			await navigateTo(localePath("/admin/articles"));
		}
	} catch (error) {
		console.error(error);
		toast.add({ title: t("AdminPage.editor.saving_failed.title"), color: "error" });
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
	const appBaseUrl = env.public.appBaseUrl ?? "https://lexat21.lapis-online.at";
	const url = `${appBaseUrl}/${selectedLanguage.value}/articles/${alias.value}`;

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

const selectBibliographyItem = (value: string | undefined) => {
	if (value) {
		addBibliographyItem(value);
	}

	nextTick(() => {
		selectedBibliographyKey.value = undefined;
	});
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
			const result = await $fetch<APIMediaUploadResponse>(`/media/upload/${routeId}`, {
				baseURL: env.public.apiBaseUrl,
				credentials: "include",
				body: formData,
				method: "POST",
				headers: headers,
			});
			// DEBUG
			// const result = {
			// 	url: "https://images.pexels.com/photos/934055/pexels-photo-934055.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
			// };
			cover.value = result.imageUrl;
			toast.add({ title: t("AdminPage.editor.cover.upload_succeeded"), color: "success" });
		} catch (error) {
			console.error(error);
			toast.add({ title: t("AdminPage.editor.cover.upload_failed"), color: "error" });
		}
	}
};

watch(title, (newValue) => {
	alias.value = generateAlias(newValue);
});

watch(selectedCategory, (newValue) => {
	if (newValue !== "commentary") {
		selectedQuestion.value = undefined;
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
				><UIcon name="i-lucide-arrow-left" class="size-4" />Back</NuxtLinkLocale
			>
			<div class="mb-8 flex justify-between border-b pb-8">
				<div>
					<h3 class="text-3xl font-semibold">{{ title || "Untitled" }}</h3>
					<p v-if="postId" class="text-foreground/70">ID: {{ postId }}</p>
				</div>
				<div class="flex items-center gap-3">
					<label class="sr-only" for="status">{{ t("AdminPage.editor.status.status") }}</label>
					<USelect
						id="status"
						v-model="activeStatus"
						:items="statusOptions"
						size="lg"
						class="w-48"
					/>
					<UButton size="lg" @click="saveArticle">Save</UButton>
				</div>
			</div>
			<div class="bg-background">
				<div class="mb-6 flex flex-col gap-5 md:flex-row">
					<div class="w-full max-w-xl space-y-5 md:w-1/2">
						<div class="grid w-full items-center gap-1.5">
							<label for="title">{{ t("AdminPage.editor.title") }}</label>
							<UInput
								id="title"
								v-model="title"
								class="w-full"
								:placeholder="t('AdminPage.editor.title')"
								type="text"
								size="lg"
							/>
						</div>
						<div class="grid w-full items-center gap-1.5">
							<label class="flex items-center gap-1" for="alias"
								>{{ t("AdminPage.editor.alias.label") }}
								<UTooltip
									:content="{ side: 'top' }"
									:delay-duration="0"
									:text="t('AdminPage.editor.alias.tooltip')"
								>
									<UIcon name="i-lucide-info" class="size-4" />
								</UTooltip>
							</label>
							<UInput
								id="alias"
								v-model="alias"
								:placeholder="t('AdminPage.editor.alias.placeholder')"
								type="text"
								size="lg"
							/>
						</div>
						<div class="grid w-full gap-1.5">
							<label for="abstract">{{ t("AdminPage.editor.abstract") }}</label>
							<UTextarea
								id="abstract"
								v-model="abstract"
								:rows="8"
								:placeholder="t('AdminPage.editor.abstract')"
								type="text"
							/>
						</div>
						<div v-if="languageOptions" class="grid items-center gap-1.5">
							<label for="language">{{ t("AdminPage.editor.language.label") }}</label>
							<USelect
								id="language"
								v-model="selectedLanguage"
								:items="languageOptions"
								:placeholder="t('AdminPage.editor.language.placeholder')"
								size="lg"
								class="w-64"
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
								class="flex aspect-video w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 hover:bg-gray-100 dark:border-gray-600 dark:bg-gray-700 dark:hover:border-gray-500 dark:hover:bg-gray-800"
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
							<label for="coverAlt">{{ t("AdminPage.editor.cover_alt.label") }}</label>
							<UInput
								id="coverAlt"
								v-model="coverAlt"
								:placeholder="t('AdminPage.editor.cover_alt.placeholder')"
								type="text"
							/>
						</div>
					</div>
				</div>

				<div class="mb-6 grid w-full items-center gap-1.5">
					<label for="content">{{ t("AdminPage.editor.content") }}</label>
					<ClientOnly>
						<TextEditor v-model="content" class="w-full" />
					</ClientOnly>
					<!-- DEBUG CONTENT <p>{{ content }}</p> -->
				</div>
				<div class="mb-6 flex items-baseline gap-8">
					<div v-if="categoryOptions" class="grid max-w-sm items-center gap-1.5">
						<label for="category">{{ t("AdminPage.editor.category.label") }}</label>
						<USelect
							id="category"
							v-model="selectedCategory"
							:items="categoryOptions"
							:placeholder="t('AdminPage.editor.category.placeholder')"
							size="lg"
							class="w-64"
						/>
					</div>

					<div
						v-if="
							(selectedCategory === 'commentary' || selectedCategory === 'short_description') &&
							mappedQuestions.length
						"
						class="grid max-w-sm items-center gap-1.5"
					>
						<label for="phenomenon">{{ t("AdminPage.editor.question.label") }}</label>
						<USelectMenu
							id="phenomenon"
							v-model="selectedQuestion"
							:items="mappedQuestions"
							:placeholder="t('AdminPage.editor.question.placeholder')"
							size="lg"
							class="w-64"
						/>
					</div>
				</div>
				<div v-if="authorsOptions" class="mb-6 grid w-full max-w-xl items-center gap-1.5">
					<label for="authors">{{ t("AdminPage.editor.authors.label") }}</label>
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
						<label for="citation">{{ t("AdminPage.editor.citation.label") }}</label>
						<UTextarea
							id="citation"
							v-model="citation"
							:placeholder="t('AdminPage.editor.citation.placeholder')"
							type="text"
							:rows="4"
						/>
						<div class="flex w-full justify-end gap-1.5">
							<UButton
								variant="outline"
								icon="i-lucide-wand-sparkles"
								size="lg"
								@click="generateCitation"
								>{{ t("AdminPage.editor.citation.generate") }}</UButton
							>
							<CopyToClipboard :text="citation" />
						</div>
					</div>
				</div>
				<div class="mb-6 max-w-3xl space-y-3">
					<UFormField
						:label="t('AdminPage.editor.bibliography.label')"
						:hint="
							selectedBibliographyItems.length
								? t('AdminPage.editor.bibliography.selected', {
										count: selectedBibliographyItems.length,
									})
								: undefined
						"
					>
						<UInputMenu
							id="bibliography"
							v-model="selectedBibliographyKey"
							class="w-full"
							:filter-fields="['label', 'description']"
							icon="i-lucide-search"
							:items="availableBibliographyOptions"
							:placeholder="t('AdminPage.editor.bibliography.placeholder')"
							size="lg"
							value-key="value"
							virtualize
							@update:model-value="selectBibliographyItem"
						>
							<template #empty>
								{{ t("TagsCombobox.empty") }}
							</template>
						</UInputMenu>
					</UFormField>

					<ul
						v-if="selectedBibliographyItems.length"
						class="divide-y divide-default overflow-hidden rounded-lg border border-default"
					>
						<li
							v-for="item in selectedBibliographyItems"
							:key="item.key"
							class="flex items-center gap-3 p-3"
						>
							<div class="min-w-0 grow">
								<p class="text-sm font-medium text-highlighted">{{ item.title }}</p>
								<p v-if="item.date" class="mt-0.5 text-xs text-muted">{{ item.date }}</p>
							</div>
							<UButton
								:aria-label="t('AdminPage.editor.bibliography.remove', { title: item.title })"
								color="error"
								icon="i-lucide-trash-2"
								size="sm"
								variant="ghost"
								@click="removeBibliographyItem(item.key)"
							/>
						</li>
					</ul>
				</div>
			</div>
		</div>
	</MainContent>
</template>
