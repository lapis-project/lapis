<script setup lang="ts" generic="TData extends TableData">
import type { TableColumn, TableData } from "@nuxt/ui";

type UserTableMeta = {
	refresh: () => Promise<void>;
};

const props = defineProps<{
	columns: Array<TableColumn<TData>>;
	data: Array<TData>;
	refresh: () => Promise<void>;
}>();

const meta = computed<UserTableMeta>(() => ({
	refresh: props.refresh,
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
