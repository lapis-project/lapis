<script setup lang="ts" generic="TData extends TableData">
import type { TableColumn, TableData } from "@nuxt/ui";
import type { TableMeta } from "@tanstack/vue-table";

const props = defineProps<{
	columns: Array<TableColumn<TData>>;
	data: Array<TData>;
	refresh: () => Promise<void>;
}>();

const meta = computed<TableMeta<TData> & { refresh: () => Promise<void> }>(() => ({
	refresh: props.refresh,
}));
</script>

<template>
	<UTable
		class="rounded-md border"
		:columns="columns"
		:data="data"
		empty="No results."
		:meta="meta"
		:ui="{ td: 'text-highlighted' }"
	/>
</template>
