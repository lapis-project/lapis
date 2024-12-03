<script lang="ts" setup>
const t = useTranslations();

const { articles, totalResults } = useArticles();

const formatPublishDate = (publishedAt: string) => {
	const publishDate = new Date(publishedAt);
	return publishDate.toLocaleDateString(undefined, {
		year: "numeric",
		month: "short",
		day: "numeric",
	});
};

const formattedAuthors = (
	authors: Array<{ firstname: string | null; lastname: string | null }>,
) => {
	const authorNames = authors.map((author) => `${author.firstname} ${author.lastname}`);
	if (!authorNames) {
		return "";
	}

	const authorsString = authorNames.join(", ");

	return authorsString;
};

const collections = [
	{
		label: t("AdminNavigation.articles"),
		alias: "articles",
		disabled: false,
	},
	{
		label: `${t("AdminNavigation.users")} (soon)`,
		alias: "users",
		disabled: true,
	},
	{
		label: `${t("AdminNavigation.categories")} (soon)`,
		alias: "categories",
		disabled: true,
	},
];

usePageMetadata({
	title: t("ArticlesPage.meta.title"),
});
</script>

<template>
	<MainContent class="container flex gap-8 py-8">
		<PageTitle class="sr-only">{{ t("ArticlesPage.title") }}</PageTitle>
		<aside class="w-1/4 rounded border p-5">
			<div class="flex items-center justify-between text-sm">
				<h2 class="uppercase text-muted-foreground">
					{{ t("AdminPage.navigation.collections") }}
				</h2>
				<div class="rounded-md bg-muted px-2 py-1 leading-none text-muted-foreground">
					{{ collections.length }}
				</div>
			</div>
			<ul class="list-inside list-disc px-2 py-3 text-lg">
				<li v-for="collection in collections" :key="collection.alias">
					<NuxtLinkLocale
						v-if="collection.disabled === false"
						exact-active-class="text-accent-foreground"
						:to="`/admin/${collection.alias}`"
					>
						{{ collection.label }}
					</NuxtLinkLocale>
					<span v-else class="cursor-not-allowed text-muted-foreground">
						{{ collection.label }}</span
					>
				</li>
			</ul>
		</aside>
		<div class="flex max-w-3xl flex-col gap-8">
			<div class="text-3xl">{{ totalResults }} Artikel</div>
			<div v-for="article in articles" :key="article.alias">
				<div class="uppercase tracking-wide">
					{{ t(`AdminPage.editor.category.${article.post_type}`) }}
				</div>
				<h2 class="mb-1 text-2xl tracking-wide">{{ article.title }}</h2>
				<p class="text-lg">{{ formattedAuthors(article.authors) }}</p>
				<div v-if="article.published_at" class="mb-2">
					{{ t("ArticleDetailPage.published_at") }}:
					{{ formatPublishDate(article.published_at) }}
				</div>
				<p class="line-clamp-3 border-l-4 pl-2">{{ article.abstract }}</p>
			</div>
		</div>
	</MainContent>
</template>
