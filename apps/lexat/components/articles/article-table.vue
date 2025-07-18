<script setup lang="ts" generic="TData, TValue">
import { type ColumnDef, FlexRender, getCoreRowModel, useVueTable } from "@tanstack/vue-table";

const props = defineProps<{
	columns: Array<ColumnDef<TData>>;
	data: Array<TData>;
	deleteArticle: (id: number) => Promise<void>;
}>();

const table = useVueTable({
	get data() {
		return props.data;
	},
	get columns() {
		return props.columns;
	},
	getCoreRowModel: getCoreRowModel(),
	meta: { deleteArticle: props.deleteArticle },
});
</script>

<template>
	<div class="rounded-md border">
		<Table>
			<TableHeader>
				<TableRow v-for="headerGroup in table.getHeaderGroups()" :key="headerGroup.id">
					<TableHead v-for="header in headerGroup.headers" :key="header.id">
						<FlexRender
							v-if="!header.isPlaceholder"
							:props="header.getContext()"
							:render="header.column.columnDef.header"
						/>
					</TableHead>
				</TableRow>
			</TableHeader>
			<TableBody>
				<template v-if="table.getRowModel().rows?.length">
					<TableRow
						v-for="row in table.getRowModel().rows"
						:key="row.id"
						:data-state="row.getIsSelected() ? 'selected' : undefined"
					>
						<TableCell v-for="cell in row.getVisibleCells()" :key="cell.id">
							<FlexRender :props="cell.getContext()" :render="cell.column.columnDef.cell" />
						</TableCell>
					</TableRow>
				</template>
				<template v-else>
					<TableRow>
						<TableCell class="h-24 text-center" :colspan="columns.length"> No results. </TableCell>
					</TableRow>
				</template>
			</TableBody>
		</Table>
	</div>
</template>
