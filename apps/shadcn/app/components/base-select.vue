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
	dataTestid?: string;
	id?: string;
	size?: "large" | "medium" | "small";
}

const props = withDefaults(defineProps<Props>(), {
	placeholder: "Select an option",
	size: "large",
});

const hasColor = computed(() => {
	return props.options.find((o) => o.color);
});

const width = computed(() => {
	switch (props.size) {
		default:
		case "large":
			return "w-full sm:w-64";
		case "medium":
			return "w-full sm:w-48";
		case "small":
			return "w-full sm:w-32";
	}
});
</script>

<template>
	<!-- eslint-disable vuejs-accessibility/form-control-has-label -->
	<Select v-model="modelValue">
		<SelectTrigger :id="props.id" :class="width" :data-testid="props.dataTestid">
			<SelectValue>
				<template v-if="modelValue">
					<svg v-if="hasColor" class="size-3" viewBox="0 0 12 12">
						<circle
							cx="6"
							cy="6"
							:fill="props.options.find((o) => o.value === modelValue)?.color"
							r="6"
						/>
					</svg>
					{{ props.options.find((question) => question.value === modelValue)?.label }}
				</template>
				<template v-else>{{ props.placeholder }}</template>
			</SelectValue>
		</SelectTrigger>
		<SelectContent>
			<SelectGroup>
				<SelectLabel v-if="props.label">{{ props.label }}</SelectLabel>
				<SelectItem v-for="option in props.options" :key="option.value" :value="option.value">
					<svg v-if="option.color" class="size-3" viewBox="0 0 12 12">
						<circle cx="6" cy="6" :fill="option.color" r="6" />
					</svg>
					{{ option.label }}
				</SelectItem>
			</SelectGroup>
		</SelectContent>
	</Select>
</template>
