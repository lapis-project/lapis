<script lang="ts" setup>
import { DrawerClose, type DrawerCloseProps } from "vaul-vue";

const props = defineProps<DrawerCloseProps>();
</script>

<template>
	<DrawerClose data-slot="drawer-close" v-bind="props">
		<slot />
	</DrawerClose>
</template>
