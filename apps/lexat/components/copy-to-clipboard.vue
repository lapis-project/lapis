<script setup lang="ts">
import { useClipboard } from "@vueuse/core";
import { CheckIcon, ClipboardIcon } from "lucide-vue-next";
import { toast } from "vue-sonner";

const props = defineProps<{
	text: string;
}>();

const t = useTranslations();

const { copy, copied, isSupported } = useClipboard({ source: props.text });

const copyToClipboard = async (text: string) => {
	try {
		await copy(text);
		toast(t("Clipboard.copy-success"));
	} catch (e) {
		console.error(e, t("Clipboard.copy-fail"));
	}
};
</script>

<template>
	<ClientOnly>
		<Button v-if="isSupported" variant="outline" @click="copyToClipboard(props.text)">
			<component :is="copied ? CheckIcon : ClipboardIcon" class="mr-2 size-4" />
			<span v-if="!copied">{{ t("Clipboard.copy") }}</span>
			<span v-else>{{ t("Clipboard.copied") }}</span>
		</Button>
	</ClientOnly>
</template>
