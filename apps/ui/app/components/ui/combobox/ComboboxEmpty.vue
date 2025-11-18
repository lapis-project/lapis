<script setup lang="ts">
import { reactiveOmit } from "@vueuse/core";
import { ComboboxEmpty, type ComboboxEmptyProps } from "reka-ui";
import type { HTMLAttributes } from "vue";

import { cn } from "@/utils/styles";

const props = defineProps<ComboboxEmptyProps & { class?: HTMLAttributes["class"] }>();

const delegatedProps = reactiveOmit(props, "class");
</script>

<template>
	<ComboboxEmpty
		v-bind="delegatedProps"
		:class="cn('py-6 text-center text-sm', props.class)"
		data-slot="combobox-empty"
	>
		<slot />
	</ComboboxEmpty>
</template>
