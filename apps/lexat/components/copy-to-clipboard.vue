<script setup lang="ts">
import { useClipboard } from "@vueuse/core";
import { ClipboardIcon } from "lucide-vue-next";

import { useToast } from "@/components/ui/toast/use-toast";

const props = defineProps<{
	text: string;
}>();

const { toast } = useToast();

const { copy, copied, isSupported } = useClipboard({ source: props.text });

const copyToClipboard = async (text: string) => {
	try {
		await copy(text);
		toast({
			title: "Copied to clipboard",
		});
	} catch (e) {
		console.error(e, "Cant save to clipboard");
	}
};
</script>

<template>
	<div>
		<Button v-if="isSupported" variant="outline" @click="copyToClipboard(props.text)">
			<ClipboardIcon class="mr-2 size-4" />
			<span v-if="!copied">Copy</span>
			<span v-else>Copied!</span>
		</Button>
		<Toaster />
	</div>
</template>
