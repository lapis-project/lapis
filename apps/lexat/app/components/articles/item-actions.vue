<script setup lang="ts">
import { Edit, Trash } from "lucide-vue-next";
import { toast } from "vue-sonner";

const t = useTranslations();

const props = defineProps<{
	item: {
		post_id: number;
	};
	onDelete: (id: number) => Promise<void>;
}>();

const localePath = useLocalePath();
const editItem = async () => {
	await navigateTo(localePath(`/admin/articles/${props.item.post_id}`));
};
const deleteItem = async () => {
	try {
		await props.onDelete(props.item.post_id);
		toast.success(t("AdminPage.articles.deletion_succeeded"));
	} catch {
		toast.error(t("AdminPage.articles.deletion_failed"));
	}
};
</script>

<template>
	<div class="flex items-center gap-3">
		<Edit class="size-5 cursor-pointer hover:text-accent-foreground" @click="editItem"></Edit>
		<Trash class="size-5 cursor-pointer hover:text-accent-foreground" @click="deleteItem"></Trash>
	</div>
</template>
