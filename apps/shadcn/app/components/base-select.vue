<script setup lang="ts">
const modelValue = defineModel<string | Array<string> | undefined>();

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
	multiple?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
	placeholder: "Select an option",
	size: "large",
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

const selectedOptions = computed(() => {
	if (!modelValue.value || modelValue.value.length === 0) return [];

	// Multiple Selection (Array)
	if (props.multiple && Array.isArray(modelValue.value)) {
		return props.options.filter((o) => modelValue.value?.includes(o.value));
	}

	// Single Selection (String)
	const single = props.options.find((o) => o.value === modelValue.value);
	return single ? [single] : [];
});
</script>

<template>
	<!-- eslint-disable-next-line vuejs-accessibility/form-control-has-label -->
	<Select v-model="modelValue" :multiple="props.multiple">
		<SelectTrigger :id="props.id" :class="width" :data-testid="props.dataTestid">
			<SelectValue>
				<div v-if="selectedOptions.length > 0" class="flex items-center gap-2 truncate">
					<svg
						v-if="!props.multiple && selectedOptions[0]?.color"
						class="size-3 shrink-0"
						viewBox="0 0 12 12"
					>
						<circle cx="6" cy="6" :fill="selectedOptions[0].color" r="6" />
					</svg>

					<span class="truncate">
						{{ selectedOptions.map((o) => o.label).join(", ") }}
					</span>
				</div>
				<template v-else>{{ props.placeholder }}</template>
			</SelectValue>
		</SelectTrigger>

		<SelectContent>
			<SelectGroup>
				<SelectLabel v-if="props.label">{{ props.label }}</SelectLabel>

				<SelectItem v-for="option in props.options" :key="option.value" :value="option.value">
					<span class="flex items-center gap-2">
						<svg v-if="option.color" class="size-3 shrink-0" viewBox="0 0 12 12">
							<circle cx="6" cy="6" :fill="option.color" r="6" />
						</svg>
						{{ option.label }}
					</span>
				</SelectItem>
			</SelectGroup>
		</SelectContent>
	</Select>
</template>
