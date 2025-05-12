<script setup lang="ts">
import type { HTMLAttributes } from "vue";

import { cn } from "@/utils/styles";

import { type AlertVariants, alertVariants } from ".";

const props = defineProps<{
	class?: HTMLAttributes["class"];
	variant?: AlertVariants["variant"];
}>();
</script>

<template>
	<div :class="cn(alertVariants({ variant }), props.class)" data-slot="alert" role="alert">
		<slot />
	</div>
</template>
