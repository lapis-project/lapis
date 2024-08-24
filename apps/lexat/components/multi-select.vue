<script setup lang="ts">
import { Check, ChevronsUpDown } from "lucide-vue-next";
import { ref } from "vue";

import { Button } from "@/components/ui/button";
import { Command, CommandGroup, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { DropdownOption } from "@/types/dropdown-option";
import { cn } from "@/utils/styles";

const t = useTranslations();

const model = defineModel<Array<string>>({ default: [""] });

export interface Props {
	options: Array<DropdownOption>;
	placeholder?: string;
	singleLevel?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
	placeholder: "question",
	singleLevel: false,
});

const emit = defineEmits<{
	(event: "selected"): void;
}>();

const levelZeroElement = computed(() => props.options.find((o) => o.level === 0));

const showAll = computed(
	() => model.value.length === 1 && model.value[0] === levelZeroElement.value?.value,
);

const toggelSelection = (selection: string) => {
	const option = props.options.find((o) => o.value === selection);
	let modifiedModel: Array<string> = [];
	if (option?.level === 0) {
		// level 0 elements cannot be deselected and when toggled, deselect all other options
		model.value = [selection];
		// model.value = props.options.map((o) => o.value);
	} else if (!model.value.includes(selection)) {
		if (levelZeroElement.value && model.value.includes(levelZeroElement.value.value)) {
			model.value.shift(); // level 0 elements are always on the first index
		}
		let group = props.options.filter((o) => o.group === option?.group).map((g) => g.value);
		if (option?.level === 1) {
			group = group.filter((i) => !model.value.includes(i)); // remove group elements that are already selected
			modifiedModel.push(...model.value, ...group);
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
		}
		const allNonLevelZeroSelected = props.options
			.filter((o) => o.level !== 0)
			.every((o) => modifiedModel.includes(o.value));
		if (allNonLevelZeroSelected && levelZeroElement.value) {
			// Automatically select level 0 option if all others are selected
			modifiedModel = [levelZeroElement.value.value];
		}
		model.value = modifiedModel;
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
		if (levelZeroElement.value && modifiedModel.length === 0) {
			modifiedModel.push(levelZeroElement.value.value);
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
				<span class="grow truncate text-left">
					{{
						model.length
							? props.options.find((question) => question.value === model[0])?.label
							: t("Combobox.button", { placeholder: props.placeholder })
					}}
				</span>
				<svg v-if="model.length > 1" width="20" height="20" class="ml-1 shrink-0">
					<circle cx="10" cy="10" r="10" fill="currentColor" />
					<text
						text-anchor="middle"
						dominant-baseline="central"
						x="50%"
						y="50%"
						fill="currentColor"
						class="text-xs text-primary-foreground"
					>
						+{{ model.length - 1 }}
					</text>
				</svg>
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
									cn(
										'mr-2 h-4 w-4',
										model.includes(question.value) || showAll ? 'opacity-100' : 'opacity-0',
									)
								"
							/>
							<div
								class="flex-1"
								:class="{ 'font-semibold': question.level === 1 && !props.singleLevel }"
							>
								<span v-if="question.level === 2" class="opacity-50">- </span>{{ question.label }}
							</div>
						</CommandItem>
					</CommandGroup>
				</CommandList>
			</Command>
		</PopoverContent>
	</Popover>
</template>
