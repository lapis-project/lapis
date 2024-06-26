<script setup lang="ts">
import { ComboboxAnchor, ComboboxInput, ComboboxPortal, ComboboxRoot } from "radix-vue";
import { computed, ref } from "vue";

import { CommandEmpty, CommandGroup, CommandItem, CommandList } from "@/components/ui/command";
import {
	TagsInput,
	TagsInputInput,
	TagsInputItem,
	TagsInputItemDelete,
	TagsInputItemText,
} from "@/components/ui/tags-input";

import type { DropdownOption } from "./data-map-view.vue";

const t = useTranslations();

const props = defineProps<{
	options: Array<DropdownOption>;
	placeholder: string;
}>();

const modelValue = defineModel<Array<string>>({ default: () => [] });

// const modelValue = ref<Array<string>>([]);
const open = ref(false);
const searchTerm = ref("");

const filteredOptions = computed(() =>
	props.options.filter((i) => !modelValue.value.includes(i.label)),
);
</script>

<template>
	<TagsInput class="w-80 gap-0 px-0" :model-value="modelValue">
		<div class="flex flex-wrap items-center gap-2 px-3">
			<TagsInputItem v-for="item in modelValue" :key="item" :value="item">
				<TagsInputItemText />
				<TagsInputItemDelete />
			</TagsInputItem>
		</div>

		<ComboboxRoot
			v-model="modelValue"
			v-model:open="open"
			v-model:searchTerm="searchTerm"
			class="w-full"
		>
			<ComboboxAnchor as-child>
				<ComboboxInput
					:placeholder="t('TagsCombobox.button', { placeholder: props.placeholder })"
					as-child
				>
					<TagsInputInput
						class="w-full px-3"
						:class="modelValue.length > 0 ? 'mt-2' : ''"
						@keydown.enter.prevent
					/>
				</ComboboxInput>
			</ComboboxAnchor>

			<ComboboxPortal>
				<CommandList
					position="popper"
					class="mt-2 w-[--radix-popper-anchor-width] rounded-md border bg-popover text-popover-foreground shadow-md outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2"
					dismissable
				>
					<CommandEmpty>{{ t("Combobox.empty") }}</CommandEmpty>
					<CommandGroup>
						<CommandItem
							v-for="option in filteredOptions"
							:key="option.value"
							:value="option.label"
							@select.prevent="
								(ev) => {
									if (typeof ev.detail.value === 'string') {
										searchTerm = '';
										modelValue.push(ev.detail.value);
									}

									if (filteredOptions.length === 0) {
										open = false;
									}
								}
							"
						>
							{{ option.label }}
						</CommandItem>
					</CommandGroup>
				</CommandList>
			</ComboboxPortal>
		</ComboboxRoot>
	</TagsInput>
</template>
