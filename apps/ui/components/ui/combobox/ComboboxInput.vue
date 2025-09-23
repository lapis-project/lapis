<script setup lang="ts">
import { reactiveOmit } from "@vueuse/core";
import { SearchIcon } from "lucide-vue-next";
import {
	ComboboxInput,
	type ComboboxInputEmits,
	type ComboboxInputProps,
	useForwardPropsEmits,
} from "reka-ui";
import type { HTMLAttributes } from "vue";

import { cn } from "@/utils/styles";

defineOptions({
	inheritAttrs: false,
});

const props = defineProps<
	ComboboxInputProps & {
		class?: HTMLAttributes["class"];
	}
>();

const emits = defineEmits<ComboboxInputEmits>();

const delegatedProps = reactiveOmit(props, "class");

const forwarded = useForwardPropsEmits(delegatedProps, emits);
</script>

<template>
	<div class="flex h-9 items-center gap-2 border-b px-3" data-slot="command-input-wrapper">
		<SearchIcon class="size-4 shrink-0 opacity-50" />
		<ComboboxInput
			:class="
				cn(
					'placeholder:text-muted-foreground flex h-10 w-full rounded-md bg-transparent py-3 text-sm outline-hidden disabled:cursor-not-allowed disabled:opacity-50',
					props.class,
				)
			"
			data-slot="command-input"
			v-bind="{ ...forwarded, ...$attrs }"
		>
			<slot />
		</ComboboxInput>
	</div>
</template>
