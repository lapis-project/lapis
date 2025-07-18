<script lang="ts" setup>
/* eslint-disable vue/no-v-html */
import type { InferResponseType } from "hono/client";
import { ArrowLeft, Database, MapPin } from "lucide-vue-next";

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
const localePath = useLocalePath();
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

const isProjectDescription = computed(() => {
	return article.value?.post_type_name === "project_description";
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

const phenomenonId = computed(() => {
	return data.value?.article?.phenomenon?.[0]?.phenomenon_id;
});

const goToDbPage = async (): Promise<void> => {
	await navigateTo({
		path: localePath("db"),
		query: {
			q: phenomenonId.value,
		},
	});
};

const goToMapsPage = async (): Promise<void> => {
	await navigateTo({
		path: localePath("maps"),
		query: {
			q: phenomenonId.value,
		},
	});
};

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
	cover: article.value?.cover ?? undefined,
	contentType: "article",
	jsonld: jsonld.value,
});

// solution using scroll-margin-top doesn't seem to work just yet https://github.com/nuxt/nuxt/pull/9187
const scrollTo = (id) => {
	const el = document.getElementById(id);
	if (!el) {
		return;
	}
	const headerOffset = 80; // your header height
	const top = el.getBoundingClientRect().top + window.pageYOffset - headerOffset;
	window.scrollTo({ top, behavior: "smooth" });
};
</script>

<template>
	<MainContent class="container py-8">
		<NuxtLinkLocale
			v-if="!isProjectDescription"
			class="mb-6 inline-flex items-center gap-1"
			to="/articles"
			><ArrowLeft class="size-4" /> {{ t("ArticleDetailPage.back") }}</NuxtLinkLocale
		>
		<div class="flex flex-col sm:flex-row gap-8">
			<article v-if="article" class="sm:w-3/4">
				<div
					v-if="!isProjectDescription"
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
				<div v-if="article?.post_type_name !== 'short_description'" class="block sm:hidden">
					<hr class="my-8" />
					<div class="font-bold block sm:hidden text-2xl mb-5">
						{{ t("ArticleDetailPage.toc") }}
					</div>
					<ul class="-ml-4 list-inside list-disc text-xl">
						<li
							v-for="item in tableOfContents"
							:key="item.id"
							class="py-1"
							:style="{ marginLeft: `${(item.level - 1) * 20}px` }"
						>
							<a :href="`#${item.id}`">{{ item.text }}</a>
						</li>
					</ul>
				</div>
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
					<p class="max-w-2xl italic">
						{{ article.citation }}
					</p>
				</div>
			</article>
			<aside class="hidden sm:block w-1/4">
				<section class="sticky top-20 border p-5">
					<template v-if="article?.post_type_name !== 'short_description'">
						<div class="font-bold">{{ t("ArticleDetailPage.toc") }}</div>
						<hr class="my-2" />
						<ul class="-ml-4 list-inside list-disc">
							<li
								v-for="item in tableOfContents"
								:key="item.id"
								:style="{ marginLeft: `${(item.level - 1) * 20}px` }"
							>
								<a :href="`#${item.id}`" @click.prevent="scrollTo(item.id)">{{ item.text }}</a>
							</li>
						</ul>
					</template>
					<template v-else-if="phenomenonId">
						<div class="font-bold">{{ t("ArticleDetailPage.interlinking.title") }}</div>
						<hr class="my-2" />
						<p class="mb-5">{{ t("ArticleDetailPage.interlinking.text") }}</p>
						<div class="flex flex-col items-center gap-3">
							<Button variant="outline" @click="goToMapsPage"
								><MapPin class="mr-2 size-4" />{{
									t("ArticleDetailPage.interlinking.go-to-map")
								}}</Button
							>
							{{ t("ArticleDetailPage.interlinking.or") }}
							<Button variant="outline" @click="goToDbPage"
								><Database class="mr-2 size-4" />{{
									t("ArticleDetailPage.interlinking.go-to-db")
								}}</Button
							>
						</div>
					</template>
				</section>
			</aside>
		</div>
	</MainContent>
</template>
