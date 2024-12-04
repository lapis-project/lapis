<script lang="ts" setup>
import { ArrowLeft } from "lucide-vue-next";

import { useCitationGenerator } from "@/composables/citationGenerator";
import { formatAuthors } from "@/utils/article-helper";
import { addIdsToHeadings } from "@/utils/html-helpers";
import { useFetch, useRoute } from "#app";

const { bibliographyItems, getCitation, fetchBibliographyItems } = useCitationGenerator();

const t = useTranslations();
const env = useRuntimeConfig();
const route = useRoute();
const alias = route.params.alias;

interface APIArticleResponse {
	article: {
		post_id: number;
		title: string;
		alias: string;
		cover: string;
		cover_alt: string;
		abstract: string;
		content: string;
		lang: string;
		published_at: string; // ISO date string
		updated_at: string; // ISO date string
		created_at: string; // ISO date string
		citation: string;
		creator_firstname: string;
		creator_lastname: string;
		post_type_name: string;
		phenomenon: Array<{
			phenomenon_id: number;
			name: string;
		}>;
		bibliography: Array<{
			name: string;
		}>;
		authors: Array<{
			firstname: string;
			lastname: string;
		}>;
	};
}

const { data } = await useFetch<APIArticleResponse>(`articles/detail/${alias}`, {
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

if (!bibliographyItems.value.length) {
	await fetchBibliographyItems();
}

if (article.value?.content) {
	const enrichedContent = addIdsToHeadings(article.value.content);
	article.value.content = enrichedContent;
}

usePageMetadata({
	title: article.value?.title ?? "Beitrag",
	description: article.value?.abstract,
	// cover: article.value?.cover ?? "/default-cover.jpg", TODO: add default cover
	cover: article.value?.cover,
	url: `${env.public.apiBaseUrl}${route.fullPath}`,
	contentType: "article",
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
				<p class="mb-1">
					{{ t("ArticleDetailPage.authors") }}: {{ formatAuthors(article.authors) }}
				</p>
				<div v-if="publishedAt" class="mb-4 italic">
					{{ t("ArticleDetailPage.published_at") }}: {{ publishedAt }} ({{
						t("ArticleDetailPage.updated_at")
					}}: {{ updatedAt }})
				</div>
				<NuxtImg
					:alt="article.cover_alt"
					class="aspect-[16/9] w-full rounded-t-lg object-cover"
					:src="article.cover"
				/>
				<hr class="mt-5" />

				<div class="article-content" v-html="article.content"></div>
				<div v-if="article.bibliography && article.bibliography.length" class="article-content">
					<h2>{{ t("ArticleDetailPage.bibliography") }}</h2>
					<p v-for="key in article.bibliography" :key="key.name" v-html="getCitation(key.name)"></p>
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
				<section class="sticky top-10 border p-5">
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
