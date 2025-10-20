<script setup lang="ts">
import { Check, ChevronsUpDown, Search } from "lucide-vue-next";
import { computed, ref } from "vue";

const modelValue = defineModel<Array<ComboboxOption>>({ default: [] });

export interface ComboboxOption {
	label: string;
	value: string;
}

export interface Props {
	options: Array<ComboboxOption>;
	placeholder?: string;
	label?: string;
	dataTestid?: string;
}

const props = withDefaults(defineProps<Props>(), {
	placeholder: "Select an option",
});

// local input state
const search = ref("");

/** list to show:
 * - if search has text -> filter all options by search
 * - else if there are selected values -> show ONLY selected values
 * - else -> show nothing (and we won't render the group)
 */
const displayedOptions = computed<Array<ComboboxOption>>(() => {
	const q = search.value.trim().toLowerCase();
	if (q) {
		return props.options.filter((o) => o.label.toLowerCase().includes(q));
	}
	if (modelValue.value.length > 0) {
		// ensure objects come from the original 'options' array if you need referential equality
		const selectedValues = new Set(modelValue.value.map((o) => o.value));
		return props.options.filter((o) => selectedValues.has(o.value));
	}
	return [];
});

// only render the group if there is search text OR we have selections
const shouldShowGroup = computed(() => search.value.trim() !== "" || modelValue.value.length > 0);

const showEmpty = computed(() => search.value.trim() !== "" && displayedOptions.value.length === 0);

// keep local search in sync with input element
function onInput(e: Event) {
	search.value = (e.target as HTMLInputElement).value ?? "";
}
</script>

<template>
	<Combobox v-model="modelValue" by="label" multiple>
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

		<ComboboxList align="start" class="max-h-52">
			<div class="relative w-full max-w-sm items-center">
				<ComboboxInput
					class="focus-visible:ring-0 border-0 border-b rounded-none h-10"
					:placeholder="`${props.placeholder}...`"
					:value="search"
					@input="onInput"
				/>
				<span class="absolute start-0 inset-y-0 flex items-center justify-center px-3">
					<Search class="size-4 text-muted-foreground" />
				</span>
			</div>

			<ComboboxEmpty v-if="showEmpty"> No item found. </ComboboxEmpty>

			<ComboboxGroup v-if="shouldShowGroup">
				<ComboboxItem v-for="option in displayedOptions" :key="option.value" :value="option">
					{{ option.label }}
					<ComboboxItemIndicator>
						<Check :class="cn('ml-auto h-4 w-4')" />
					</ComboboxItemIndicator>
				</ComboboxItem>
			</ComboboxGroup>
		</ComboboxList>
	</Combobox>
</template>
