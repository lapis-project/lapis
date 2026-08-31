<script setup lang="ts">
const t = useTranslations();

const emit = defineEmits<{
	(e: "download", hasAgreed: boolean): void;
}>();

const props = defineProps<{
	open: boolean;
}>();

const hasAgreed = ref(false);

// reset checkbox whenever dialog opens
watch(
	() => props.open,
	(open) => {
		if (open) {
			hasAgreed.value = false;
		}
	},
);
</script>

<template>
	<UModal
		:open="open"
		@update:open="emit('download', false)"
		:title="t('Disclaimer.download.title')"
	>
		<template #body>
			<p class="mb-3">{{ t("Disclaimer.download.text") }}</p>
			<div class="flex w-fit gap-2 items-center rounded border p-2">
				<UCheckbox id="disclaimer-consent" v-model="hasAgreed" />
				<label
					class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
					for="disclaimer-consent"
				>
					{{ t("Disclaimer.download.checkbox") }}
				</label>
			</div>
		</template>
		<template #footer>
			<UButton :disabled="!hasAgreed" @click="emit('download', hasAgreed)">
				{{ t("Disclaimer.download.action") }}
			</UButton>
		</template>
	</UModal>
</template>
