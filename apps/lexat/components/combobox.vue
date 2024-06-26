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
import { cn } from "@/utils/styles";

import type { DropdownOption } from "./data-map-view.vue";

const t = useTranslations();

const model = defineModel<string>({ default: "" });

export interface Props {
	options: Array<DropdownOption>;
	placeholder?: string;
	hasSearch?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
	placeholder: "question",
	hasSearch: false,
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
				class="w-64 justify-between"
			>
				<span class="truncate">
					{{
						model
							? props.options.find((question) => question.value === model)?.label
							: t("Combobox.button", { placeholder: props.placeholder })
					}}
				</span>
				<ChevronsUpDown class="ml-2 size-4 shrink-0 opacity-50" />
			</Button>
		</PopoverTrigger>
		<PopoverContent id="popover-content" class="w-64 p-0" role="listbox">
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
							{{ question.label }}
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
