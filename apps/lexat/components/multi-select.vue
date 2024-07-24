<script setup lang="ts">
import { Check, ChevronsUpDown } from "lucide-vue-next";
import { ref } from "vue";

import { Button } from "@/components/ui/button";
import { Command, CommandGroup, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/utils/styles";

import type { DropdownOption } from "./data-map-view.vue";

const t = useTranslations();

const model = defineModel<Array<string>>({ default: [""] });

export interface Props {
	options: Array<DropdownOption>;
	placeholder?: string;
}

const props = withDefaults(defineProps<Props>(), {
	placeholder: "question",
});

const emit = defineEmits<{
	(event: "selected"): void;
}>();

const toggelSelection = (selection: string) => {
	const option = props.options.find((o) => o.value === selection);
	const levelZeroElement = props.options.find((o) => o.level === 0);
	let modifiedModel: Array<string> = [];
	if (option?.level === 0) {
		// level 0 elements cannot be deselected and when toggled, deselect all other options
		model.value = [selection];
	} else if (!model.value.includes(selection)) {
		if (levelZeroElement && model.value.includes(levelZeroElement.value)) {
			model.value.shift(); // level 0 elements are always on the first index
		}
		let group = props.options.filter((o) => o.group === option?.group).map((g) => g.value);
		if (option?.level === 1) {
			group = group.filter((i) => !model.value.includes(i)); // remove group elements that are already selected
			model.value.push(...group);
		} else if (option?.level === 2) {
			let groupChilds: Array<string> = [];
			let groupParent = "";
			props.options.forEach((o) => {
				if (o.group === option.group && o.level === 1) {
					groupParent = o.value;
				} else if (o.group === option.group && o.level === 2) {
					groupChilds.push(o.value);
				}
			});

			modifiedModel = [...model.value, selection];
			if (groupChilds.every((g) => modifiedModel.includes(g))) {
				modifiedModel.push(groupParent);
			}
			model.value = modifiedModel;
		}
	} else {
		let modifiedModel: Array<string> = [];
		if (option?.level === 1) {
			// remove all selected options belonging to the respective group
			const group = props.options.filter((o) => o.group === option.group).map((g) => g.value);
			modifiedModel = model.value.filter((l) => !group.includes(l));
		} else if (option?.level === 2) {
			const parentElement = props.options.find((o) => o.group === option.group);
			modifiedModel = model.value.filter((l) => l !== parentElement?.value && l !== selection);
		}
		// in case no option is selected, add back the level 0 element
		if (levelZeroElement && modifiedModel.length === 0) {
			modifiedModel.push(levelZeroElement.value);
		}
		model.value = modifiedModel;
	}
	emit("selected");
	// inputRef?.current?.focus();
};

const open = ref(false);
</script>

<template>
	<Popover v-model:open="open">
		<PopoverTrigger as-child class="">
			<Button
				variant="outline"
				role="combobox"
				:aria-expanded="open"
				aria-controls="popover-content"
				class="w-64 justify-between"
			>
				<span class="truncate">
					{{
						model
							? props.options.find((question) => question.value === model[0])?.label
							: t("Combobox.button", { placeholder: props.placeholder })
					}}
				</span>
				<ChevronsUpDown class="ml-2 size-4 shrink-0 opacity-50" />
			</Button>
		</PopoverTrigger>
		<PopoverContent id="popover-content" class="w-64 p-0" role="listbox">
			<Command>
				<CommandList>
					<CommandGroup>
						<CommandItem
							v-for="question in props.options"
							:key="question.value"
							:value="question.value"
							@select="
								(ev) => {
									if (typeof ev.detail.value === 'string') {
										toggelSelection(ev.detail.value);
									}
								}
							"
						>
							<Check
								:class="
									cn('mr-2 h-4 w-4', model.includes(question.value) ? 'opacity-100' : 'opacity-0')
								"
							/>
							<div class="flex-1" :class="{ 'font-semibold': question.level === 1 }">
								<span v-if="question.level === 2" class="opacity-50">- </span>{{ question.label }}
							</div>
						</CommandItem>
					</CommandGroup>
				</CommandList>
			</Command>
		</PopoverContent>
	</Popover>
</template>
