// apps/lexat/app/components/combobox-base.vue
<script setup lang="ts">
import { Check, ChevronsUpDown } from "@lucide/vue";
import { ref } from "vue";

import type { DropdownOption } from "@/types/dropdown-option";

const t = useTranslations();

const model = defineModel<string | null>({ default: "" });

export interface Props<T = string> {
	options: Array<DropdownOption<T>>;
	placeholder?: string;
	hasSearch?: boolean;
	width?: "w-24" | "w-44" | "w-60" | "w-64" | "w-80";
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
</script>

<template>
	<Popover v-model:open="open">
		<PopoverTrigger as-child class="">
			<Button
				aria-controls="popover-content"
				:aria-expanded="open"
				class="justify-between"
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
							:key="question.id"
							class="group"
							:value="question.label ?? ''"
							@select="
								(ev) => {
									if (typeof ev.detail.value === 'string') {
										if (!selectOnly) {
											model = question.value;
										}
										emit('selected', question.value ?? '');
									}
									open = false;
								}
							"
						>
							<div
								class="flex-1 overflow-hidden pr-2 [container-type:inline-size] [-webkit-mask-image:linear-gradient(to_right,black_90%,transparent_100%)] [mask-image:linear-gradient(to_right,black_90%,transparent_100%)]"
							>
								<span class="scrolling-text block w-max min-w-full whitespace-nowrap">
									{{ question.label }}
								</span>
							</div>
							<Check
								:class="
									cn(
										'ml-auto size-4 shrink-0',
										model === question.value ? 'opacity-100' : 'opacity-0',
									)
								"
							/>
						</CommandItem>
					</CommandGroup>
				</CommandList>
			</Command>
		</PopoverContent>
	</Popover>
</template>

<style scoped>
.group:hover .scrolling-text {
	animation: ping-pong 2s linear infinite alternate;
}

@keyframes ping-pong {
	0%,
	15% {
		transform: translateX(0);
	}

	85%,
	100% {
		transform: translateX(calc(100cqw - 100%));
	}
}
</style>
