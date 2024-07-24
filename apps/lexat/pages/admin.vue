<script lang="ts" setup>
// eslint-disable-next-line import-x/no-named-as-default
import StarterKit from "@tiptap/starter-kit";
import { EditorContent, useEditor } from "@tiptap/vue-3";

const t = useTranslations();

const editor = useEditor({
	content: "<p>I’m running Tiptap with Nuxt.js. 🎉</p>",
	extensions: [StarterKit],
});

usePageMetadata({
	title: t("AdminPage.meta.title"),
});
</script>

<template>
	<MainContent class="container grid grid-rows-[auto_1fr] content-start py-8">
		<div>
			<!-- <PageTitle class="sr-only">{{ t("AdminPage.title") }}</PageTitle> -->
		</div>
		<ErrorBoundary>
			<ClientOnly>
				<EditorContent :editor="editor" />
			</ClientOnly>
		</ErrorBoundary>
	</MainContent>
</template>
