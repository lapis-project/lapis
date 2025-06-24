<script lang="ts" setup>
import { DrawerDescription, type DrawerDescriptionProps } from "vaul-vue";
import { computed, type HtmlHTMLAttributes } from "vue";

import { cn } from "@/utils/styles";

const props = defineProps<DrawerDescriptionProps & { class?: HtmlHTMLAttributes["class"] }>();

const delegatedProps = computed(() => {
	const { class: _, ...delegated } = props;

	return delegated;
});
</script>

<template>
	<DrawerDescription
		v-bind="delegatedProps"
		:class="cn('text-muted-foreground text-sm', props.class)"
		data-slot="drawer-description"
	>
		<slot />
	</DrawerDescription>
</template>
