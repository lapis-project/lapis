<script setup lang="ts">
import { Edit, Trash } from "lucide-vue-next";
import { toast } from "vue-sonner";

import { Toaster } from "@/components/ui/sonner";

const { deleteArticle } = useAdminArticles();
const t = useTranslations();

const props = defineProps<{
	item: {
		post_id: number;
	};
}>();

const localePath = useLocalePath();
const editItem = async () => {
	await navigateTo(localePath(`/admin/articles/${props.item.post_id}`));
};
const deleteItem = async () => {
	try {
		await deleteArticle(props.item.post_id);
		toast.success(t("AdminPage.articles.deletion_succeeded"));
	} catch (error) {
		console.error(error);
		toast.error(t("AdminPage.articles.deletion_failed"));
	}
};
</script>

<template>
	<div class="flex items-center gap-3">
		<Edit class="size-5 cursor-pointer hover:text-accent-foreground" @click="editItem"></Edit>
		<Trash class="size-5 cursor-pointer hover:text-accent-foreground" @click="deleteItem"></Trash>
		<ClientOnly>
			<Toaster />
		</ClientOnly>
	</div>
</template>
