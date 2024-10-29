<script lang="ts" setup>
import { ArrowLeft } from "lucide-vue-next";

import { useFetch, useRoute } from "#app";

const t = useTranslations();

const route = useRoute();
const alias = route.params.alias;

const { data: article } = await useFetch(`/api/article/${alias}`);

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
	// regexto match headings (h1, h2,...) with optional id attributes
	const headingRegex = /<(h[1-6])\s*(?:id="([^"]+)")?>(.*?)<\/\1>/g;
	const toc = [];
	let match;

	while ((match = headingRegex.exec(article.value?.content)) !== null) {
		const [_, tag, id, text] = match;
		const level = parseInt(tag[1]);

		// use the existing ID if it’s present, or generate a new one if not
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
	// Map the authors to the "<lastName>, <firstName>" format
	const authorNames = article.value?.authors.map(
		(author) => `${author.lastName}, ${author.firstName}`,
	);
	if (!authorNames) {
		return "";
	}

	const authorsString = authorNames.join(" / ");

	return authorsString;
});

usePageMetadata({
	title: article.value?.title ?? "Beitrag",
	description: article.value?.abstract,
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
				<NuxtImg class="aspect-[16/10] rounded-t-lg" src="/images/posts/example-1-cropped.jpg" />
				<hr class="mt-5" />

				<div class="article-content" v-html="article.content"></div>
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

<style lang="css">
.article-content h2 {
	@apply text-2xl font-bold  mt-8 mb-4;
}

.article-content h3 {
	@apply text-xl font-semibold mt-6 mb-3;
}

.article-content p {
	@apply leading-relaxed  mt-4;
}

.article-content a {
	@apply text-blue-600 hover:underline font-medium;
}

.article-content ul {
	@apply list-disc list-inside pl-5 mt-2;
}

.article-content ol {
	@apply list-decimal list-inside pl-5 mt-2;
}

.article-content li {
	@apply mt-2;
}

.article-content blockquote {
	@apply italic text-gray-500 border-l-4 border-blue-300 pl-4 my-6;
}

.article-content img {
	@apply rounded-lg shadow-md mt-6 mb-4 w-full;
}

.article-content figcaption {
	@apply text-sm italic text-center;
}

.article-content pre {
	@apply bg-gray-100 text-sm p-4 rounded-lg overflow-x-auto my-6;
}

.article-content code {
	@apply bg-gray-100 px-1 py-0.5 rounded text-sm text-red-600;
}
</style>
