<script setup lang="ts">
const props = defineProps<{
	color: string;
	label: string;
}>();

const emit = defineEmits<{
	update: [color: string];
}>();

const t = useTranslations();

const title = computed(() => t("MapsPage.settings.colors.choose", { label: props.label }));
</script>

<template>
	<UPopover>
		<UButton
			:aria-label="title"
			class="size-5 shrink-0 rounded-full border border-input p-0 ring-ring ring-offset-2 ring-offset-background hover:border-2"
			:style="{ backgroundColor: color }"
			:title="title"
			variant="outline"
		/>

		<template #content>
			<div class="flex flex-col gap-2 p-2">
				<UColorPicker :model-value="color" @update:model-value="emit('update', $event)" />
				<span class="text-center text-xs uppercase text-muted-foreground">{{ color }}</span>
			</div>
		</template>
	</UPopover>
</template>
