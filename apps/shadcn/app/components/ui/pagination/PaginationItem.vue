<script setup lang="ts">
import { reactiveOmit } from "@vueuse/core";
import { PaginationListItem, type PaginationListItemProps } from "reka-ui";
import type { HTMLAttributes } from "vue";

import { type ButtonVariants, buttonVariants } from "@/components/ui/button";
import { cn } from "@/utils/styles";

const props = withDefaults(
	defineProps<
		PaginationListItemProps & {
			size?: ButtonVariants["size"];
			class?: HTMLAttributes["class"];
			isActive?: boolean;
		}
	>(),
	{
		size: "icon",
	},
);

const delegatedProps = reactiveOmit(props, "class", "size", "isActive");
</script>

<template>
	<PaginationListItem
		v-bind="delegatedProps"
		:class="
			cn(
				buttonVariants({
					variant: isActive ? 'outline' : 'ghost',
					size,
				}),
				props.class,
			)
		"
		data-slot="pagination-item"
	>
		<slot />
	</PaginationListItem>
</template>
