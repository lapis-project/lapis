<script setup lang="ts">
import { Check, ChevronsUpDown } from "lucide-vue-next";
import { ref } from "vue";

import { Button } from "@/components/ui/button";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import type { DropdownOption } from "@/types/dropdown-option";
import { cn } from "@/utils/styles";

const t = useTranslations();

const model = defineModel<string | null>({ default: "" });

export interface Props {
	options: Array<DropdownOption>;
	placeholder?: string;
	hasSearch?: boolean;
	width?: "w-44" | "w-60" | "w-64";
}

const props = withDefaults(defineProps<Props>(), {
	placeholder: "question",
	hasSearch: false,
	width: "w-64",
});

const emit = defineEmits<{
	(event: "selected"): void;
}>();

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
				class="justify-between"
				:class="[props.width]"
			>
				<div class="flex items-center">
					<svg v-if="model" width="12" height="12" class="mr-2">
						<circle
							cx="6"
							cy="6"
							r="6"
							:fill="props.options.find((question) => question.value === model)?.color"
						/>
					</svg>
					<span class="truncate">
						{{
							model
								? props.options.find((question) => question.value === model)?.label
								: t("Combobox.button", { placeholder: props.placeholder })
						}}
					</span>
				</div>
				<ChevronsUpDown class="ml-2 size-4 shrink-0 opacity-50" />
			</Button>
		</PopoverTrigger>
		<PopoverContent id="popover-content" class="p-0" :class="[props.width]" role="listbox">
			<Command>
				<template v-if="hasSearch">
					<CommandInput
						class="h-9"
						:placeholder="t('Combobox.search', { placeholder: props.placeholder })"
					/>
					<CommandEmpty>{{ t("Combobox.empty", { placeholder: props.placeholder }) }}</CommandEmpty>
				</template>
				<CommandList>
					<CommandGroup>
						<CommandItem
							v-for="question in props.options"
							:key="question.value"
							:value="question.value"
							@select="
								(ev) => {
									if (typeof ev.detail.value === 'string') {
										model = ev.detail.value;
									}
									open = false;
									emit('selected');
								}
							"
						>
							<svg v-if="question.color" width="12" height="12" class="mr-2 inline align-baseline">
								<circle cx="6" cy="6" r="6" :fill="question.color" /></svg
							>{{ question.label }}
							<Check
								:class="
									cn('ml-auto h-4 w-4', model === question.value ? 'opacity-100' : 'opacity-0')
								"
							/>
						</CommandItem>
					</CommandGroup>
				</CommandList>
			</Command>
		</PopoverContent>
	</Popover>
</template>
