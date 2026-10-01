<script lang="ts" setup>
import { CodeIcon } from "@lucide/vue";
import { useClipboard } from "@vueuse/core";
import type { LocationQueryRaw } from "vue-router";

const props = defineProps<{
	query: LocationQueryRaw;
	question: string;
}>();

const t = useTranslations();
const toast = useToast();
const localePath = useLocalePath();
const requestUrl = useRequestURL();

function escapeAttribute(value: string) {
	return value
		.replaceAll("&", "&amp;")
		.replaceAll('"', "&quot;")
		.replaceAll("<", "&lt;")
		.replaceAll(">", "&gt;");
}

const snippet = computed(() => {
	const src = new URL(localePath({ path: "/embed/map", query: props.query }), requestUrl.origin)
		.href;
	const title = t("EmbedPage.title", { question: props.question });
	return `<iframe
	src="${src}"
	title=""${escapeAttribute(title)}"
	width="100%"
	height="600"
	style="border: 0"
	loading="lazy"
></iframe>
	`;
});

const { copy, copied, isSupported } = useClipboard();

async function copySnippet() {
	try {
		await copy(snippet.value);
		toast.add({ title: t("Clipboard.copy-success") });
	} catch {
		toast.add({ title: t("Clipboard.copy-fail"), color: "error" });
	}
}
</script>

<template>
	<UModal :description="t('MapsPage.embed.description')" :title="t('MapsPage.embed.title')">
		<UTooltip :content="{ side: 'top' }" :text="t('MapsPage.controls.embed')">
			<UButton class="aspect-square" data-testid="embed" variant="outline">
				<CodeIcon class="size-4" />
				<span class="sr-only">{{ t("MapsPage.controls.embed") }}</span>
			</UButton>
		</UTooltip>

		<template #body>
			<pre
				class="overflow-x-auto rounded-md border bg-muted p-3 text-xs"
				data-testid="embedSnippet"
			><code>{{ snippet }}</code></pre>
			<UButton
				v-if="isSupported"
				class="mt-3"
				:icon="copied ? 'i-lucide-copy-check' : 'i-lucide-copy'"
				variant="outline"
				@click="copySnippet"
			>
				{{ copied ? t("Clipboard.copied") : t("Clipboard.copy") }}
			</UButton>
		</template>
	</UModal>
</template>
