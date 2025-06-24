<script setup lang="ts">
import { ChevronLeft, ChevronRight } from "lucide-vue-next";
import { ComboboxAnchor, ComboboxInput, ComboboxPortal, ComboboxRoot } from "reka-ui";
import { computed, ref } from "vue";

import type { DropdownOption } from "@/types/dropdown-option";

const t = useTranslations();

const props = defineProps<{
	options: Array<DropdownOption>;
	placeholder: string;
	moveable?: boolean;
}>();

const modelValue = defineModel<Array<string>>({ default: () => [] });

// const modelValue = ref<Array<string>>([]);
const open = ref(false);
const searchTerm = ref("");

const filteredOptions = computed(() =>
	props.options.filter((i) => !modelValue.value.includes(i.label)),
);

const emit = defineEmits<{
	(e: "update:modelValue", value: Array<string>): void;
}>();

const moveItem = (index: number, direction: "left" | "right") => {
	const newArray = [...modelValue.value];
	if (direction === "left" && index > 0) {
		// Swap the item with the one before it
		[newArray[index - 1], newArray[index]] = [newArray[index], newArray[index - 1]];
	} else if (direction === "right" && index < modelValue.value.length - 1) {
		// Swap the item with the one after it
		[newArray[index + 1], newArray[index]] = [newArray[index], newArray[index + 1]];
	}
	emit("update:modelValue", newArray);
};
</script>

<template>
	<TagsInput class="gap-0 px-0" :model-value="modelValue">
		<div class="flex flex-wrap items-center gap-2 px-3">
			<TagsInputItem v-for="(item, index) in modelValue" :key="item" :value="item">
				<TagsInputItemText />
				<template v-if="moveable">
					<ChevronLeft v-if="index > 0" class="size-4" @click="moveItem(index, 'left')" />
					<ChevronRight
						v-if="index !== modelValue.length - 1"
						class="size-4"
						@click="moveItem(index, 'right')"
					/>
				</template>
				<TagsInputItemDelete />
			</TagsInputItem>
		</div>

		<ComboboxRoot v-model="modelValue" v-model:open="open" class="w-full">
			<ComboboxAnchor as-child>
				<ComboboxInput
					v-model="searchTerm"
					as-child
					:placeholder="t('TagsCombobox.button', { placeholder: props.placeholder })"
				>
					<TagsInputInput
						class="w-full px-3"
						:class="modelValue.length > 0 ? 'mt-2' : ''"
						@focus="open = true"
						@keydown.enter.prevent
					/>
				</ComboboxInput>
			</ComboboxAnchor>

			<ComboboxPortal>
				<CommandList
					class="mt-2 w-(--reka-popper-anchor-width) rounded-md border bg-popover text-popover-foreground shadow-md outline-hidden data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2"
					dismissable
					position="popper"
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
