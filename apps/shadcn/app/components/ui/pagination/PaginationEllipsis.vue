<script setup lang="ts">
import { reactiveOmit } from "@vueuse/core";
import { MoreHorizontal } from "lucide-vue-next";
import { PaginationEllipsis, type PaginationEllipsisProps } from "reka-ui";
import type { HTMLAttributes } from "vue";

import { cn } from "@/utils/styles";

const props = defineProps<PaginationEllipsisProps & { class?: HTMLAttributes["class"] }>();

const delegatedProps = reactiveOmit(props, "class");
</script>

<template>
	<PaginationEllipsis
		v-bind="delegatedProps"
		:class="cn('flex size-9 items-center justify-center', props.class)"
		data-slot="pagination-ellipsis"
	>
		<slot>
			<MoreHorizontal class="size-4" />
			<span class="sr-only">More pages</span>
		</slot>
	</PaginationEllipsis>
</template>
