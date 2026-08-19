<script setup lang="ts">
import { Check, ChevronsUpDown } from "@lucide/vue";
import { computed, ref } from "vue";

import type { DropdownOption } from "@/types/dropdown-option";

const t = useTranslations();

const model = defineModel<string | null>({ default: "" });

export interface Props<T = string> {
	options: Array<DropdownOption<T>>;
	placeholder?: string;
	hasSearch?: boolean;
	width?: "w-24" | "w-44" | "w-60" | "w-64" | "w-80" | "w-full";
	selectOnly?: boolean;
	dataTestid?: string;
}

const props = withDefaults(defineProps<Props>(), {
	placeholder: "question",
	hasSearch: false,
	width: "w-64",
	selectOnly: false,
});

const emit = defineEmits<{
	(event: "selected", value: string): void;
}>();

const open = ref(false);
const search = ref("");

const filteredOptions = computed(() => {
	if (!props.hasSearch || !search.value) return props.options;
	const query = search.value.toLowerCase();
	return props.options.filter((option) => option.label?.toLowerCase().includes(query));
});

function selectOption(option: DropdownOption) {
	if (!props.selectOnly) {
		model.value = option.value;
	}
	emit("selected", option.value ?? "");
	open.value = false;
	search.value = "";
}
</script>

<template>
	<UPopover v-model:open="open" :content="{ align: 'start', side: 'bottom' }">
		<UButton
			aria-controls="popover-content"
			:aria-expanded="open"
			class="justify-between bg-card"
			:class="[props.width]"
			:data-testid="props.dataTestid"
			role="combobox"
			variant="outline"
		>
			<span class="truncate">
				{{
					model
						? props.options.find((question) => question.value === model)?.label
						: t("Combobox.button", { placeholder: props.placeholder })
				}}
			</span>
			<ChevronsUpDown class="ml-2 size-4 shrink-0 opacity-50" />
		</UButton>

		<template #content>
			<div id="popover-content" class="p-0" :class="[props.width]" role="listbox">
				<template v-if="hasSearch">
					<UInput
						v-model="search"
						class="w-full"
						:placeholder="t('Combobox.search', { placeholder: props.placeholder })"
						variant="none"
					/>
					<USeparator />
				</template>
				<div class="max-h-64 overflow-y-auto p-1">
					<p v-if="hasSearch && !filteredOptions.length" class="py-6 text-center text-sm">
						{{ t("Combobox.empty", { placeholder: props.placeholder }) }}
					</p>
					<button
						v-for="question in filteredOptions"
						:key="question.id"
						:aria-selected="model === question.value"
						class="flex w-full items-center rounded-sm px-2 py-1.5 text-sm hover:bg-accent"
						role="option"
						type="button"
						@click="selectOption(question)"
					>
						{{ question.label }}
						<Check
							class="ml-auto size-4"
							:class="model === question.value ? 'opacity-100' : 'opacity-0'"
						/>
					</button>
				</div>
			</div>
		</template>
	</UPopover>
</template>
