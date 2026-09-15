<script setup lang="ts">
const t = useTranslations();
const toast = useToast();

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
		toast.add({ title: t("AdminPage.articles.deletion_succeeded"), color: "success" });
	} catch {
		toast.add({ title: t("AdminPage.articles.deletion_failed"), color: "error" });
	}
};
</script>

<template>
	<div>
		<UButton icon="i-lucide-edit" variant="ghost" @click="editItem" />
		<UButton icon="i-lucide-trash" variant="ghost" @click="deleteItem" />
	</div>
</template>
