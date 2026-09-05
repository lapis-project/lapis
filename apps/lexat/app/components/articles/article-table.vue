<script setup lang="ts" generic="TData extends TableData">
import type { TableColumn, TableData } from "@nuxt/ui";

type ArticleTableMeta = {
	deleteArticle: (id: number) => Promise<void>;
};

const props = defineProps<{
	columns: Array<TableColumn<TData>>;
	data: Array<TData>;
	deleteArticle: (id: number) => Promise<void>;
}>();

const meta = computed<ArticleTableMeta>(() => ({
	deleteArticle: props.deleteArticle,
}));
</script>

<template>
	<UTable
		class="rounded-md border border-muted"
		:columns="columns"
		:data="data"
		empty="No results."
		:meta="meta"
		:ui="{ td: 'text-highlighted' }"
	/>
</template>
