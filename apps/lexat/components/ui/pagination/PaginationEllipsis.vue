<script setup lang="ts">
import { MoreHorizontal } from "lucide-vue-next";
import { PaginationEllipsis, type PaginationEllipsisProps } from "reka-ui";
import { computed, type HTMLAttributes } from "vue";

import { cn } from "@/utils/styles";

const props = defineProps<PaginationEllipsisProps & { class?: HTMLAttributes["class"] }>();

const delegatedProps = computed(() => {
	const { class: _, ...delegated } = props;

	return delegated;
});
</script>

<template>
	<PaginationEllipsis
		v-bind="delegatedProps"
		:class="cn('flex size-9 items-center justify-center', props.class)"
	>
		<slot>
			<MoreHorizontal />
		</slot>
	</PaginationEllipsis>
</template>
