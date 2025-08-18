<script setup lang="ts">
const t = useTranslations();

const user = useUser();

const isSuperadmin = computed(() => {
	return user.value?.role_name === "superadmin";
});

const collections = [
	{
		label: t("AdminNavigation.articles"),
		alias: "articles",
		disabled: false,
	},
	{
		label: `${t("AdminNavigation.users")}`,
		alias: "user-management",
		disabled: !isSuperadmin.value,
	},
	{
		label: `${t("AdminNavigation.categories")} (soon)`,
		alias: "categories",
		disabled: true,
	},
];
</script>

<template>
	<aside class="rounded border p-5">
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
				<span v-else class="cursor-not-allowed text-muted-foreground"> {{ collection.label }}</span>
			</li>
		</ul>
	</aside>
</template>
