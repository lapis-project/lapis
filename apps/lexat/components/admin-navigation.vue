<script setup lang="ts">
const t = useTranslations();

const collections = [
	{
		label: "Articles",
		alias: "articles",
	},
	{
		label: "Users",
		alias: "users",
	},
	{
		label: "Categories",
		alias: "categories",
	},
];
</script>

<template>
	<aside class="rounded border p-5">
		<div class="flex items-center justify-between text-sm">
			<h2 class="uppercase text-muted-foreground">
				{{ t("AdminPage.navigation.collections") }}
			</h2>
			<div class="rounded-md bg-muted px-2 py-1 leading-none text-muted">
				{{ collections.length }}
			</div>
		</div>
		<ul class="list-inside list-disc px-2 py-3 text-lg">
			<li v-for="collection in collections" :key="collection.alias">
				<NuxtLinkLocale
					:to="`/admin/${collection.alias}`"
					exact-active-class="text-accent-foreground"
				>
					{{ collection.label }}
				</NuxtLinkLocale>
			</li>
		</ul>
	</aside>
</template>
