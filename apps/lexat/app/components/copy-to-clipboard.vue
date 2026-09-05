<script setup lang="ts">
import { useClipboard } from "@vueuse/core";

const props = defineProps<{
	text: string;
}>();

const toast = useToast();
const t = useTranslations();

const { copy, copied, isSupported } = useClipboard({ source: props.text });

const copyToClipboard = async (text: string) => {
	try {
		await copy(text);
		toast.add({ title: t("Clipboard.copy-success") });
	} catch (e) {
		console.error(e, t("Clipboard.copy-fail"));
	}
};
</script>

<template>
	<ClientOnly>
		<UButton
			v-if="isSupported"
			variant="outline"
			size="lg"
			:icon="copied ? 'i-lucide-copy-check' : 'i-lucide-copy'"
			@click="copyToClipboard(props.text)"
		>
			<span v-if="!copied">{{ t("Clipboard.copy") }}</span>
			<span v-else>{{ t("Clipboard.copied") }}</span>
		</UButton>
	</ClientOnly>
</template>
