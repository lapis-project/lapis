<script setup lang="ts">
import { Check, ChevronsUpDown, Search } from "lucide-vue-next";

import { Button } from "@/components/ui/button";
import {
	Combobox,
	ComboboxAnchor,
	ComboboxEmpty,
	ComboboxGroup,
	ComboboxInput,
	ComboboxItem,
	ComboboxItemIndicator,
	ComboboxList,
	ComboboxTrigger,
} from "@/components/ui/combobox";
import { cn } from "@/utils/styles";

const modelValue = defineModel<Array<ComboboxOption>>({ default: [] });

export interface ComboboxOption {
	label: string;
	value: string;
}

export interface Props {
	options: Array<ComboboxOption>;
	placeholder?: string;
	multiple?: boolean;
	label?: string;
	dataTestid?: string;
}

const props = withDefaults(defineProps<Props>(), {
	placeholder: "Select an option",
	multiple: false,
});
</script>

<template>
	<Combobox v-model="modelValue" by="label" :multiple="multiple">
		<ComboboxAnchor as-child class="w-64">
			<ComboboxTrigger as-child>
				<Button class="justify-between" variant="outline">
					<span class="grow truncate text-left">
						{{ modelValue.length ? modelValue?.[0]?.label : props.placeholder }}
					</span>
					<svg v-if="modelValue.length > 1" class="ml-1 shrink-0" height="20" width="20">
						<circle cx="10" cy="10" fill="currentColor" r="10" />
						<text
							class="text-xs text-primary-foreground"
							dominant-baseline="central"
							fill="currentColor"
							text-anchor="middle"
							x="50%"
							y="50%"
						>
							+{{ modelValue.length - 1 }}
						</text>
					</svg>

					<ChevronsUpDown class="ml-2 size-4 shrink-0 opacity-50" />
				</Button>
			</ComboboxTrigger>
		</ComboboxAnchor>

		<ComboboxList align="start">
			<div class="relative w-full max-w-sm items-center">
				<ComboboxInput
					class="focus-visible:ring-0 border-0 border-b rounded-none h-10"
					:placeholder="`${props.placeholder}...`"
				/>
				<span class="absolute start-0 inset-y-0 flex items-center justify-center px-3">
					<Search class="size-4 text-muted-foreground" />
				</span>
			</div>

			<ComboboxEmpty> No item found. </ComboboxEmpty>

			<ComboboxGroup>
				<ComboboxItem v-for="option in props.options" :key="option.value" :value="option">
					{{ option.label }}

					<ComboboxItemIndicator>
						<Check :class="cn('ml-auto h-4 w-4')" />
					</ComboboxItemIndicator>
				</ComboboxItem>
			</ComboboxGroup>
		</ComboboxList>
	</Combobox>
</template>
