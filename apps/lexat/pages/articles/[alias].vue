<script lang="ts" setup>
/* eslint-disable vue/no-v-html */
import type { InferResponseType } from "hono/client";
import { ArrowLeft } from "lucide-vue-next";

import { useApiClient } from "@/composables/use-api-client";
import { useCitationGenerator } from "@/composables/use-citation-generator";
import { formatAuthors } from "@/utils/article-helper";
import { addIdsToHeadings } from "@/utils/html-helpers";
import { useFetch, useRoute } from "#app";

const { bibliographyItems, getCitation, fetchBibliographyItems } = useCitationGenerator();

const t = useTranslations();
const env = useRuntimeConfig();
const route = useRoute();
const { apiClient } = useApiClient();
const alias = route.params.alias;

const _getArticleByAlias = apiClient.articles.detail[":alias"].$get;
type APIArticleDetail = InferResponseType<typeof _getArticleByAlias, 200>;

const { data } = await useFetch<APIArticleDetail>(`articles/detail/${alias}`, {
	baseURL: env.public.apiBaseUrl,
	method: "GET",
	credentials: "include",
});

const article = computed(() => {
	return data.value?.article;
});

const publishedAt = computed(() => {
	const publishDate = article.value?.published_at
		? new Date(article.value.published_at)
		: undefined;
	return publishDate
		? publishDate.toLocaleDateString(undefined, {
				year: "numeric",
				month: "short",
				day: "numeric",
			})
		: publishDate;
});

const updatedAt = computed(() => {
	const publishDate = article.value?.updated_at ? new Date(article.value.updated_at) : undefined;
	return publishDate
		? publishDate.toLocaleDateString(undefined, {
				year: "numeric",
				month: "short",
				day: "numeric",
			})
		: publishDate;
});

const tableOfContents = computed(() => {
	if (!article.value?.content) {
		return [];
	}

	// regex to match headings with mandatory IDs (assumes addIdsToHeadings has run)
	const headingRegex = /<(h[1-6])\s+id="([^"]+)"[^>]*>(.*?)<\/\1>/g;
	const toc = [];
	let match;

	// extract headings and build TOC
	while ((match = headingRegex.exec(article.value.content)) !== null) {
		const [_, tag, id, text] = match;
		if (tag?.[1]) {
			const level = parseInt(tag[1]); // extract heading level (1-6)

			toc.push({ text, level, id });
		}
	}

	return toc;
});

onMounted(async () => {
	if (!bibliographyItems.value.length) {
		await fetchBibliographyItems(article.value?.bibliography.map((b) => b.name).join(",") ?? null);
	}
});

if (article.value?.content) {
	const enrichedContent = addIdsToHeadings(article.value.content);
	article.value.content = enrichedContent;
}

const jsonld = ref({
	"@context": "https://schema.org",
	"@type": "BlogPosting",
	headline: article.value?.title,
	image: article.value?.cover,
	datePublished: article.value?.published_at,
	dateModified: article.value?.updated_at,
	author: article.value?.authors.map((a) => ({
		"@type": "Person",
		name: `${a.firstname} ${a.lastname}`,
	})),
});

usePageMetadata({
	title: article.value?.title ?? "Beitrag",
	description: article.value?.abstract ?? undefined,
	// cover: article.value?.cover ?? "/default-cover.jpg", TODO: add default cover
	cover: article.value?.cover ?? undefined,
	url: `${env.public.apiBaseUrl}${route.fullPath}`,
	contentType: "article",
	jsonld: jsonld.value,
});
</script>

<template>
	<MainContent class="container py-8">
		<NuxtLinkLocale class="mb-6 inline-flex items-center gap-1" to="/articles"
			><ArrowLeft class="size-4" /> {{ t("ArticleDetailPage.back") }}</NuxtLinkLocale
		>
		<div class="flex gap-8">
			<article v-if="article" class="w-3/4">
				<div
					class="mb-2 inline-block rounded-full bg-slate-200 px-3 py-0.5 tracking-wider dark:text-primary-foreground"
				>
					{{ t(`AdminPage.editor.category.${article.post_type_name}`) }}
				</div>
				<PageTitle class="mb-3">{{ article.title }}</PageTitle>
				<p v-if="article.authors?.length" class="mb-1">
					{{ t("ArticleDetailPage.authors") }}: {{ formatAuthors(article.authors) }}
				</p>
				<div v-if="publishedAt" class="mb-4 italic">
					{{ t("ArticleDetailPage.published_at") }}: {{ publishedAt }}
					<span v-if="updatedAt && updatedAt !== publishedAt"
						>({{ t("ArticleDetailPage.updated_at") }}: {{ updatedAt }})</span
					>
				</div>
				<NuxtImg
					v-if="article.cover"
					:alt="article.cover_alt ?? 'Cover'"
					class="aspect-16/9 w-full rounded-t-lg object-cover"
					:src="article.cover"
				/>
				<hr class="mt-5" />
				<div class="article-content" v-html="article.content"></div>
				<div v-if="article.bibliography && article.bibliography.length" class="article-content">
					<h2>{{ t("ArticleDetailPage.bibliography") }}</h2>
					<p
						v-for="key in article.bibliography"
						:key="key.name!"
						v-html="getCitation(key.name!)"
					></p>
				</div>
				<hr class="mt-5" />
				<div v-if="article.citation">
					<h2 class="mb-4 mt-8 text-xl font-bold">{{ t("ArticleDetailPage.citation") }}</h2>
					<p class="max-w-xl italic">
						{{ article.citation }}
					</p>
				</div>
			</article>
			<aside class="w-1/4">
				<section
					v-if="article?.post_type_name !== 'short_description'"
					class="sticky top-10 border p-5"
				>
					<div class="font-bold">{{ t("ArticleDetailPage.toc") }}</div>
					<hr class="my-2" />
					<ul class="-ml-4 list-inside list-disc">
						<li
							v-for="item in tableOfContents"
							:key="item.id"
							:style="{ marginLeft: `${(item.level - 1) * 20}px` }"
						>
							<a :href="`#${item.id}`">{{ item.text }}</a>
						</li>
					</ul>
				</section>
			</aside>
		</div>
	</MainContent>
</template>
