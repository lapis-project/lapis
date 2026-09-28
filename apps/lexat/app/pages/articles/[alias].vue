<script lang="ts" setup>
import type { InferResponseType } from "hono/client";

const t = useTranslations();
const env = useRuntimeConfig();
const route = useRoute();
const { apiClient } = useApiClient();
const localePath = useLocalePath();
const currentLocale = useLocale();
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
		? publishDate.toLocaleDateString(currentLocale.value, {
				year: "numeric",
				month: "short",
				day: "numeric",
			})
		: publishDate;
});

const updatedAt = computed(() => {
	const publishDate = article.value?.updated_at ? new Date(article.value.updated_at) : undefined;
	return publishDate
		? publishDate.toLocaleDateString(currentLocale.value, {
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
	const headingRegex = /<(h[1-6])[^>]*\sid=['"]([^'"]+)['"][^>]*>(.*?)<\/\1>/gis;
	const toc: Array<{ text: string; level: number; id: string }> = [];

	// extract headings and build TOC
	let match: RegExpExecArray | null;
	while ((match = headingRegex.exec(article.value.content)) !== null) {
		const [, tag, id, text] = match;
		toc.push({
			text: text ?? "", // inner HTML of the heading
			level: Number(tag?.slice(1)), // “h2” → 2
			id: id ?? "",
		});
	}

	return toc;
});

const bibliography = computed(() => {
	if (!article.value?.bibliography?.length) {
		return [];
	}
	return article.value.bibliography
		.map((b) => b.data.data.extra)
		.toSorted(
			(a, b) => a.localeCompare(b, "de", { sensitivity: "base" }), // locale-aware alphabetical sort
		);
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
const scrollTo = (id: string) => {
	const el = document.getElementById(id);
	if (!el) {
		return;
	}
	const headerOffset = 80; // your header height
	const top = el.getBoundingClientRect().top + window.pageYOffset - headerOffset;
	window.scrollTo({ top, behavior: "smooth" });
};

const formattedTitle = computed(
	() =>
		// adds a space before and after every slash
		article.value?.title?.replace(/\//g, "/\u200B") ?? "",
);
</script>

<template>
	<MainContent class="container article-detail">
		<NuxtLinkLocale
			v-if="!isProjectDescription"
			class="article-back inline-flex items-center gap-2"
			to="/articles"
			><UIcon name="i-lucide-arrow-left" class="size-4" />
			{{ t("ArticleDetailPage.back") }}</NuxtLinkLocale
		>
		<div class="article-layout">
			<article v-if="article" class="article-main">
				<div class="article-intro" :class="{ 'article-intro-with-cover': article.cover }">
					<header class="article-header">
						<div v-if="!isProjectDescription" class="article-category">
							{{ t(`AdminPage.editor.category.${article.post_type_name}`) }}
						</div>
						<h1 class="article-title">
							{{ formattedTitle }}
						</h1>
						<p v-if="article.authors?.length" class="article-authors">
							{{ t("ArticleDetailPage.authors") }}: {{ formatAuthors(article.authors) }}
						</p>
						<div v-if="publishedAt" class="article-dates">
							{{ t("ArticleDetailPage.published_at") }}: {{ publishedAt }}
							<span v-if="updatedAt && updatedAt !== publishedAt"
								>({{ t("ArticleDetailPage.updated_at") }}: {{ updatedAt }})</span
							>
						</div>
						<div class="article-share"><ShareButton :title="article.title ?? ''" /></div>
					</header>
					<div v-if="article.cover" class="article-cover">
						<NuxtImg
							:alt="article.cover_alt ?? 'Cover'"
							class="article-cover-image"
							width="960"
							height="540"
							:src="article.cover"
						/>
					</div>
				</div>
				<nav
					v-if="article.post_type_name !== 'short_description' && tableOfContents.length"
					class="article-mobile-toc"
					:aria-label="t('ArticleDetailPage.toc')"
				>
					<details>
						<summary>{{ t("ArticleDetailPage.toc") }}</summary>
						<ul class="article-toc-list">
							<li
								v-for="item in tableOfContents"
								:key="item.id"
								:style="{ paddingLeft: `${Math.max(0, item.level - 2) * 12}px` }"
							>
								<a :href="`#${item.id}`">{{ item.text }}</a>
							</li>
						</ul>
					</details>
				</nav>
				<div class="article-content" v-html="article.content"></div>
				<div v-if="bibliography?.length" class="article-content article-bibliography">
					<h2>{{ t("ArticleDetailPage.bibliography") }}</h2>
					<p v-for="item in bibliography" :key="item" v-html="item"></p>
				</div>
				<section v-if="article.citation" class="article-citation">
					<h2 class="article-section-label">{{ t("ArticleDetailPage.citation") }}</h2>
					<blockquote class="article-citation-text">
						{{ article.citation }}
					</blockquote>
				</section>
			</article>
			<aside
				v-if="
					article &&
					((article.post_type_name !== 'short_description' && tableOfContents.length) ||
						phenomenonId)
				"
				class="article-sidebar"
			>
				<section class="article-sidebar-inner">
					<nav
						v-if="article.post_type_name !== 'short_description'"
						:aria-label="t('ArticleDetailPage.toc')"
					>
						<div class="article-section-label">{{ t("ArticleDetailPage.toc") }}</div>

						<ul class="article-toc-list">
							<li
								v-for="item in tableOfContents"
								:key="item.id"
								:style="{ paddingLeft: `${Math.max(0, item.level - 2) * 12}px` }"
							>
								<a :href="`#${item.id}`" @click.prevent="scrollTo(item.id)">{{ item.text }}</a>
							</li>
						</ul>
					</nav>
					<template v-else-if="phenomenonId">
						<div class="article-section-label">{{ t("ArticleDetailPage.interlinking.title") }}</div>

						<p class="mb-5">{{ t("ArticleDetailPage.interlinking.text") }}</p>
						<div class="flex flex-col items-center gap-3">
							<UButton icon="i-lucide-map-pin" variant="outline" size="lg" @click="goToMapsPage">{{
								t("ArticleDetailPage.interlinking.go-to-map")
							}}</UButton>
							{{ t("ArticleDetailPage.interlinking.or") }}
							<UButton variant="outline" icon="i-lucide-database" size="lg" @click="goToDbPage">{{
								t("ArticleDetailPage.interlinking.go-to-db")
							}}</UButton>
						</div>
					</template>
				</section>
			</aside>
		</div>
	</MainContent>
</template>
