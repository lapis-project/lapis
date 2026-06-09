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
	<Dialog :open="stimulusImageModal" @update:open="stimulusImageModal = $event">
		<DialogContent class="sm:max-w-[700px] max-h-[85vh] flex flex-col">
			<img
				v-if="stimulusImageUrl"
				:alt="stimulusImageAlt"
				class="max-w-full max-h-[55vh] h-auto w-auto object-contain"
				:src="stimulusImageUrl"
			/>
		</DialogContent>
	</Dialog>
</template>
