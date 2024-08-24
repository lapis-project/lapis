<script setup lang="ts">
import { Edit, Trash } from "lucide-vue-next";

const props = defineProps<{
	item: {
		alias: string;
	};
}>();

const localePath = useLocalePath();
const editItem = async () => {
	await navigateTo(localePath(`/admin/articles/${props.item.alias}`));
};
</script>

<template>
	<div class="flex items-center gap-3">
		<Edit class="size-5 cursor-pointer hover:text-accent-foreground" @click="editItem"></Edit>
		<Trash class="size-5 cursor-pointer hover:text-accent-foreground"></Trash>
	</div>
</template>
