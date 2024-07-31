<script lang="ts" setup>
const t = useTranslations();

const content = ref<string>("<p>Hello Tiptap</p>");

const collections = [
	{
		name: "Article",
		alias: "article",
	},
	{
		name: "User",
		alias: "user",
	},
];

usePageMetadata({
	title: t("AdminPage.meta.title"),
});
</script>

<template>
	<MainContent class="container grid grid-rows-[auto_1fr] content-start py-8">
		<PageTitle class="sr-only">{{ t("AdminPage.title") }}</PageTitle>
		<div class="grid grid-cols-5 gap-5">
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
					<li v-for="collection in collections" :key="collection.alias">{{ collection.name }}</li>
				</ul>
			</aside>
			<div class="col-span-3 rounded border p-8">
				<div class="mb-6 grid w-full max-w-sm items-center gap-1.5">
					<Label for="title">{{ t("AdminPage.editor.title") }}</Label>
					<Input id="title" type="text" :placeholder="t('AdminPage.editor.title')" />
				</div>
				<div class="mb-6 grid w-full max-w-sm items-center gap-1.5">
					<Label for="abstract">{{ t("AdminPage.editor.abstract") }}</Label>
					<Input id="abstract" type="text" :placeholder="t('AdminPage.editor.abstract')" />
				</div>
				<div class="grid w-full items-center gap-1.5">
					<Label for="content">{{ t("AdminPage.editor.content") }}</Label>
					<ClientOnly>
						<TextEditor v-model="content" class="w-full" />
					</ClientOnly>
				</div>
			</div>
		</div>
	</MainContent>
</template>
