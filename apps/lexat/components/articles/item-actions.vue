<script setup lang="ts">
import { Edit, Trash } from "lucide-vue-next";

import { useToast } from "@/components/ui/toast/use-toast";

const { deleteArticle } = useAdminArticles();
const { toast } = useToast();
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
		toast({
			title: t("AdminPage.articles.deletion_succeeded"),
		});
	} catch (error) {
		toast({
			title: t("AdminPage.articles.deletion_failed"),
			description: error instanceof Error ? error.message : String(error),
			variant: "destructive",
		});
	}
};
</script>

<template>
	<div class="flex items-center gap-3">
		<Edit class="size-5 cursor-pointer hover:text-accent-foreground" @click="editItem"></Edit>
		<Trash class="size-5 cursor-pointer hover:text-accent-foreground" @click="deleteItem"></Trash>
		<Toaster />
	</div>
</template>
