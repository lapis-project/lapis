<script setup lang="ts">
const modelValue = defineModel<string | null>({ default: "" });

export interface SelectOption {
	label: string;
	value: string;
}

export interface Props {
	options: Array<SelectOption>;
	placeholder?: string;
	label?: string;
}

const props = withDefaults(defineProps<Props>(), {
	placeholder: "Select an option",
});
</script>

<template>
	<!-- eslint-disable vuejs-accessibility/form-control-has-label -->
	<Select v-model="modelValue">
		<SelectTrigger class="w-[250px]">
			<SelectValue :placeholder="props.placeholder" />
		</SelectTrigger>
		<SelectContent>
			<SelectGroup>
				<SelectLabel v-if="props.label">{{ props.label }}</SelectLabel>
				<SelectItem v-for="option in props.options" :key="option.value" :value="option.value">
					{{ option.label }}
				</SelectItem>
			</SelectGroup>
		</SelectContent>
	</Select>
</template>
