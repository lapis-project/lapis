<script lang="ts" setup>
import { useToast } from "@/components/ui/toast/use-toast";
import type { DropdownOption } from "@/types/dropdown-option";

const { toast } = useToast();

const t = useTranslations();

const abstract = ref<string>("");
const content = ref<string>("<p>Hello Tiptap</p>");
const title = ref<string>("");

const saveArticle = () => {
	// do something
	toast({
		title: "Article Saved",
		description: "Your changes have successfully been saved.",
	});
};

export type Status = "draft" | "published" | "ready";

const activeStatus = ref<Status>("draft");

const statusOptions: Array<DropdownOption<Status>> = [
	{
		value: "draft",
		label: t("AdminPage.status.draft"),
		color: "#cc3232",
	},
	{
		value: "ready",
		label: t("AdminPage.status.ready"),
		color: "#e7b416",
	},
	{
		value: "published",
		label: t("AdminPage.status.published"),
		color: "#2dc937",
	},
];

const collections = [
	{
		name: "Article",
		alias: "article",
	},
	{
		name: "User",
		alias: "user",
	},
	{
		name: "Categories",
		alias: "categories",
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
			<div class="col-span-4 rounded border p-8">
				<div class="mb-8 flex justify-between border-b pb-8">
					<div>
						<h3 class="text-3xl font-semibold">Untitled</h3>
						<p class="text-foreground/70">ID: 1231231</p>
					</div>
					<div class="space-x-3">
						<Combobox
							v-model="activeStatus"
							:options="statusOptions"
							:placeholder="t('MapsPage.selection.variable.placeholder')"
							width="w-40"
						/>
						<Button @click="saveArticle">Save</Button>
					</div>
				</div>
				<div class="bg-background">
					<div class="mb-6 grid w-full max-w-sm items-center gap-1.5">
						<Label for="title">{{ t("AdminPage.editor.title") }}</Label>
						<Input
							id="title"
							v-model="title"
							type="text"
							:placeholder="t('AdminPage.editor.title')"
						/>
					</div>
					<div class="mb-6 grid w-full max-w-sm items-center gap-1.5">
						<Label for="abstract">{{ t("AdminPage.editor.abstract") }}</Label>
						<Textarea
							id="abstract"
							v-model="abstract"
							type="text"
							:placeholder="t('AdminPage.editor.abstract')"
						/>
					</div>
					<div class="grid w-full items-center gap-1.5">
						<Label for="content">{{ t("AdminPage.editor.content") }}</Label>
						<ClientOnly>
							<TextEditor v-model="content" class="w-full" />
						</ClientOnly>
					</div>
				</div>
			</div>
		</div>
		<Toaster />
	</MainContent>
</template>
