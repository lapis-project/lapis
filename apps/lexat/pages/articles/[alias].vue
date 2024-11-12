<script lang="ts" setup>
import { ArrowLeft } from "lucide-vue-next";

import { useCitationGenerator } from "@/composables/citationGenerator";
import type { Article } from "@/types/api";
import { useFetch, useRoute } from "#app";

const { bibliographyItems, getCitation, fetchBibliographyItems } = useCitationGenerator();

const t = useTranslations();
const env = useRuntimeConfig();
const route = useRoute();
const alias = route.params.alias;

const { data: article } = await useFetch<Article>(`/api/article/${alias}`);

const publishedAt = computed(() => {
	const publishDate = article.value?.publishedAt ? new Date(article.value.publishedAt) : undefined;
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
	// regex to match headings (h1, h2,...) with optional id attributes
	const headingRegex = /<(h[1-6])\s*(?:id="([^"]+)")?>(.*?)<\/\1>/g;
	const toc = [];
	let match;

	while ((match = headingRegex.exec(article.value?.content)) !== null) {
		const [_, tag, id, text] = match;
		const level = parseInt(tag[1]);

		// use the existing ID if it’s present, or generate a new one
		const headingId =
			id ||
			text
				.toLowerCase()
				.replace(/\s+/g, "-")
				.replace(/[^a-z0-9]/g, "");

		toc.push({ text, level, id: headingId });
	}

	return toc;
});

const formattedAuthors = computed(() => {
	// map the authors to the "<lastName>, <firstName>" format
	const authorNames = article.value?.authors.map(
		(author) => `${author.lastName}, ${author.firstName}`,
	);
	if (!authorNames) {
		return "";
	}

	const authorsString = authorNames.join(" / ");

	return authorsString;
});

if (!bibliographyItems.value.length) {
	await fetchBibliographyItems();
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
				<p
					class="mb-2 inline-block rounded-full bg-secondary px-2.5 py-1 text-sm font-bold dark:bg-neutral-600"
				>
					{{ t(`ArticleDetailPage.category.${article.category}`) }}
				</p>
				<PageTitle class="mb-2">{{ article.title }}</PageTitle>
				<div v-if="publishedAt" class="">
					{{ t("ArticleDetailPage.published_at") }}:
					{{ publishedAt }}
				</div>
				<p class="mb-3">{{ formattedAuthors }}</p>
				<NuxtImg class="aspect-[16/9] rounded-t-lg" src="/images/posts/example-1-cropped.jpg" />
				<hr class="mt-5" />

				<div class="article-content" v-html="article.content"></div>
				<div v-if="article.bibliography?.length" class="article-content">
					<h2>{{ t("ArticleDetailPage.bibliography") }}</h2>
					<p v-for="key in article.bibliography" :key="key" v-html="getCitation(key)"></p>
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
					<ul class="list-inside list-disc">
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
