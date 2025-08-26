<script setup lang="ts">
const modelValue = defineModel<string | null>({ default: "" });

export interface SelectOption {
	label: string;
	value: string;
	color?: string;
}

export interface Props {
	options: Array<SelectOption>;
	placeholder?: string;
	label?: string;
}

const props = withDefaults(defineProps<Props>(), {
	placeholder: "Select an option",
});

const hasColor = computed(() => {
	return props.options.find((o) => o.color);
});
</script>

<template>
	<!-- eslint-disable vuejs-accessibility/form-control-has-label -->
	<Select v-model="modelValue">
		<SelectTrigger class="w-[250px]">
			<SelectValue :placeholder="props.placeholder">
				<svg v-if="hasColor && modelValue" class="size-3" viewBox="0 0 12 12">
					<circle
						cx="6"
						cy="6"
						:fill="props.options.find((o) => o.value === modelValue)?.color"
						r="6"
					/>
				</svg>

				{{ props.options.find((question) => question.value === modelValue)?.label }}
			</SelectValue>
		</SelectTrigger>
		<SelectContent>
			<SelectGroup>
				<SelectLabel v-if="props.label">{{ props.label }}</SelectLabel>
				<SelectItem v-for="option in props.options" :key="option.value" :value="option.value">
					<svg v-if="hasColor && option.color" class="size-3" viewBox="0 0 12 12">
						<circle cx="6" cy="6" :fill="option.color" r="6" />
					</svg>
					{{ option.label }}
				</SelectItem>
			</SelectGroup>
		</SelectContent>
	</Select>
</template>
