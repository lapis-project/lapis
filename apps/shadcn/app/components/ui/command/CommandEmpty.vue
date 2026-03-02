<script setup lang="ts">
import { reactiveOmit } from "@vueuse/core";
import { Primitive, type PrimitiveProps } from "reka-ui";
import { computed, type HTMLAttributes } from "vue";

import { cn } from "@/utils/styles";

import { useCommand } from ".";

const props = defineProps<PrimitiveProps & { class?: HTMLAttributes["class"] }>();

const delegatedProps = reactiveOmit(props, "class");

const { filterState } = useCommand();
const isRender = computed(() => Boolean(filterState.search) && filterState.filtered.count === 0);
</script>

<template>
	<Primitive
		v-if="isRender"
		v-bind="delegatedProps"
		:class="cn('py-6 text-center text-sm', props.class)"
		data-slot="command-empty"
	>
		<slot />
	</Primitive>
</template>
