<script setup lang="ts">
const props = defineProps<{
	phenomenonId: number | null;
}>();

const stimulusImageUrl = ref<string | null>(null);
const stimulusImageAlt = ref<string>("");
const stimulusImageModal = ref(false);

const env = useRuntimeConfig();

function openDialog() {
	if (stimulusImageUrl.value) {
		stimulusImageModal.value = true;
	}
}

defineExpose({
	openDialog,
	hasImage: computed(() => Boolean(stimulusImageUrl.value)),
});

watch(
	() => props.phenomenonId,
	async (newId) => {
		stimulusImageUrl.value = null;
		stimulusImageAlt.value = "";
		stimulusImageModal.value = false;

		if (!newId || Number.isNaN(newId)) return;

		try {
			const data = await $fetch<{ stimulus_media?: string; phenomenon_name?: string }>(
				`/questions/phen/${newId}`,
				{
					baseURL: env.public.apiBaseUrl,
					method: "get",
				},
			);

			if (data && data.stimulus_media) {
				stimulusImageUrl.value = data.stimulus_media;
				stimulusImageAlt.value = data.phenomenon_name || "";
			}
		} catch (error) {
			console.error("Failed to fetch stimulus image:", error);
		}
	},
	{ immediate: true },
);
</script>

<template>
	<UModal
		v-model:open="stimulusImageModal"
		:title="stimulusImageAlt"
		:ui="{ content: 'sm:max-w-3xl' }"
	>
		<template #body>
			<div class="flex max-h-[75vh] items-center justify-center">
				<img
					v-if="stimulusImageUrl"
					:alt="stimulusImageAlt"
					class="max-h-[65vh] max-w-full object-contain"
					:src="stimulusImageUrl"
				/>
			</div>
		</template>
	</UModal>
</template>
