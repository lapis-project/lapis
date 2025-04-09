<script setup lang="ts">
import { ChevronsRight } from "lucide-vue-next";
import { PaginationLast, type PaginationLastProps } from "reka-ui";
import { computed, type HTMLAttributes } from "vue";

import { Button } from "@/components/ui/button";
import { cn } from "@/utils/styles";

const props = withDefaults(
	defineProps<PaginationLastProps & { class?: HTMLAttributes["class"] }>(),
	{
		asChild: true,
	},
);

const delegatedProps = computed(() => {
	const { class: _, ...delegated } = props;

	return delegated;
});
</script>

<template>
	<PaginationLast v-bind="delegatedProps">
		<Button :class="cn('size-10 p-0', props.class)" variant="outline">
			<slot>
				<ChevronsRight class="size-4" />
			</slot>
		</Button>
	</PaginationLast>
</template>
