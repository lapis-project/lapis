<script setup lang="ts">
import { ChevronLeft } from "lucide-vue-next";
import { PaginationPrev, type PaginationPrevProps } from "reka-ui";
import { computed, type HTMLAttributes } from "vue";

import { Button } from "@/components/ui/button";
import { cn } from "@/utils/styles";

const props = withDefaults(
	defineProps<PaginationPrevProps & { class?: HTMLAttributes["class"] }>(),
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
	<PaginationPrev v-bind="delegatedProps">
		<Button :class="cn('size-10 p-0', props.class)" variant="outline">
			<slot>
				<ChevronLeft class="size-4" />
			</slot>
		</Button>
	</PaginationPrev>
</template>
