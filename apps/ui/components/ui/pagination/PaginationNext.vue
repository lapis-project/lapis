<script setup lang="ts">
import { ChevronRight } from "lucide-vue-next";
import { PaginationNext, type PaginationNextProps } from "reka-ui";
import { computed, type HTMLAttributes } from "vue";

import { Button } from "@/components/ui/button";
import { cn } from "@/utils/styles";

const props = withDefaults(
	defineProps<PaginationNextProps & { class?: HTMLAttributes["class"] }>(),
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
	<PaginationNext v-bind="delegatedProps">
		<Button :class="cn('size-10 p-0', props.class)" variant="outline">
			<slot>
				<ChevronRight class="size-4" />
			</slot>
		</Button>
	</PaginationNext>
</template>
