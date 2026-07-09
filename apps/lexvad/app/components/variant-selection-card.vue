<script setup lang="ts">
defineProps<{
	data: Array<{ label: string; value: number }>;
	colors: Record<string, string>;
}>();

const t = useTranslations();
const model = defineModel<string>();
</script>

<template>
	<div class="rounded-lg p-3.5 border">
		<div class="uppercase font-semibold text-muted-foreground text-xs mb-2.5">
			{{ t("VariantSelectionCard.title") }}
		</div>
		<RadioGroup v-model="model" class="flex gap-2 flex-wrap">
			<div
				v-for="entry in data"
				:key="entry.label"
				class="border border-border flex items-center gap-1.5 rounded-full transition-[background] has-data-[state=unchecked]:bg-card! has-data-[state=checked]:border-0 p-1 px-2 bg-muted has-data-[state=checked]:text-white"
				:style="{ backgroundColor: colors[entry.label] }"
			>
				<RadioGroupItem :id="entry.label" class="sr-only peer" :value="entry.label" />
				<div
					class="size-2 rounded-full peer-data-[state=checked]:bg-white!"
					:style="{ backgroundColor: colors[entry.label] }"
				></div>

				<Label class="text-xs" :for="entry.label">{{ entry.label }}</Label>
			</div>
		</RadioGroup>
	</div>
</template>
