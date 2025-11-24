<script setup lang="ts">
const t = useTranslations();

const emit = defineEmits<{
	(e: "download", hasAgreed: boolean): void;
}>();

const props = defineProps<{
	open: boolean;
}>();

const hasAgreed = ref(false);
</script>

<template>
	<Dialog :open="props.open" @update:open="emit('download', false)">
		<DialogContent>
			<DialogHeader>
				<DialogTitle>{{ t("Disclaimer.download.title") }}</DialogTitle>
				<DialogDescription>
					{{ t("Disclaimer.download.text") }}
				</DialogDescription>
				<div class="flex gap-2 items-center rounded border p-2 max-w-sm">
					<Checkbox id="disclaimer-consent" v-model="hasAgreed" />
					<label
						class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
						for="disclaimer-consent"
					>
						{{ t("Disclaimer.download.checkbox") }}
					</label>
				</div>
			</DialogHeader>
			<DialogFooter>
				<Button :disabled="!hasAgreed" @click="emit('download', hasAgreed)">
					{{ t("Disclaimer.download.action") }}
				</Button>
			</DialogFooter>
		</DialogContent>
	</Dialog>
</template>
