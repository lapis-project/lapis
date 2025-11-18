<script lang="ts" setup>
import { DrawerTrigger, type DrawerTriggerProps } from "vaul-vue";

const props = defineProps<DrawerTriggerProps>();
</script>

<template>
	<DrawerTrigger data-slot="drawer-trigger" v-bind="props">
		<slot />
	</DrawerTrigger>
</template>
