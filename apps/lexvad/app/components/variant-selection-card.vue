<script setup lang="ts">
defineProps<{
	data: Array<{ id: string; label: string; value: number }>;
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
		<URadioGroup
			v-model="model"
			indicator="hidden"
			:items="data"
			name="variant-selection"
			:ui="{
				fieldset: 'flex flex-row flex-wrap gap-2',
				wrapper: 'w-auto',
				label: 'contents',
			}"
			value-key="id"
		>
			<template #label="{ item, modelValue }">
				<span
					class="flex items-center gap-1.5 rounded-full border border-border p-1 px-2 text-xs transition-[background] cursor-pointer"
					:class="modelValue === item.value ? 'border-0 text-white' : 'bg-card'"
					:style="modelValue === item.value ? { backgroundColor: colors[item.value] } : undefined"
				>
					<div
						class="size-2 rounded-full"
						:style="{
							backgroundColor: modelValue === item.value ? '#fff' : colors[item.value],
						}"
					></div>

					<span>{{ item.label }}</span>
				</span>
			</template>
		</URadioGroup>
	</div>
</template>
