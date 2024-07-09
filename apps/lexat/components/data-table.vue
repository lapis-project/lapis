<script setup lang="ts">
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-vue-next";

// import { truncateText } from "@/utils/string-helper.ts";

const props = defineProps<{
	data: Array<TableEntry>;
	columns: Array<TableColumn>;
}>();

export type TableEntry = Record<string, number | string>;

export interface TableColumn {
	label: string;
	value: string;
	sortable: boolean;
	footer?: string;
	sum?: boolean;
}

const sortCriterion = ref("");

const sortOrder = ref<"asc" | "desc">("asc");

const sortedData = computed(() => {
	if (!sortCriterion.value) {
		return props.data;
	}
	return [...props.data].sort((a, b) => {
		let result = 0;
		const sortValueA = a[sortCriterion.value];
		const sortValueB = b[sortCriterion.value];
		if (typeof sortValueA === "number" && typeof sortValueB === "number") {
			result = sortValueA - sortValueB;
		} else if (
			sortValueA &&
			sortValueB &&
			typeof sortValueA === "string" &&
			typeof sortValueB === "string"
		) {
			result = sortValueA.localeCompare(sortValueB);
		}
		return sortOrder.value === "asc" ? result : -result;
	});
});

const totalCount = (columnValue: string) => {
	// eslint-disable-next-line @typescript-eslint/restrict-plus-operands
	return sortedData.value.reduce((sum, item) => sum + item[columnValue], 0);
};

const setSortCriterion = (label: string) => {
	if (sortCriterion.value === label) {
		sortOrder.value = sortOrder.value === "asc" ? "desc" : "asc";
	} else {
		sortOrder.value = "desc";
	}
	sortCriterion.value = label;
};

watch(
	() => {
		return props.data;
	},
	() => {
		(sortCriterion.value = ""), (sortOrder.value = "asc");
	},
);
</script>

<template>
	<div class="relative max-h-[500px] overflow-x-auto overflow-y-scroll shadow-md sm:rounded-lg">
		<table
			class="min-w-full table-fixed text-left text-sm text-gray-500 dark:text-gray-400 rtl:text-right"
		>
			<thead
				class="sticky top-0 bg-gray-50 text-xs uppercase text-gray-700 dark:bg-gray-700 dark:text-gray-400"
			>
				<tr>
					<th v-for="column in columns" :key="column.value" scope="col" class="px-6 py-3">
						<button
							class="inline-flex cursor-pointer items-center gap-1 py-2"
							@click="setSortCriterion(column.value)"
						>
							{{ column.label }}
							<template v-if="column.sortable">
								<ArrowUp
									v-if="sortCriterion === column.value && sortOrder === 'asc'"
									class="size-4"
								/>
								<ArrowDown
									v-else-if="sortCriterion === column.value && sortOrder === 'desc'"
									class="size-4"
								/>
								<ArrowUpDown v-else class="size-4" />
							</template>
						</button>
					</th>
				</tr>
			</thead>
			<tbody class="">
				<tr
					v-for="row in sortedData"
					:key="JSON.stringify(row)"
					class="border-b bg-white dark:border-gray-700 dark:bg-gray-800"
				>
					<td v-for="value in Object.values(row)" :key="value" class="px-6 py-4">
						{{ value }}
					</td>
				</tr>
			</tbody>
			<tfoot
				class="sticky bottom-0 bg-gray-50 text-xs font-bold uppercase text-gray-700 dark:bg-gray-700 dark:text-gray-400"
			>
				<tr>
					<td v-for="column in columns" :key="column.footer" scope="col" class="px-6 py-3">
						<template v-if="column.footer">{{ column.footer }}</template>
						<template v-else-if="column.sum">{{ totalCount(column.value) }}</template>
					</td>
				</tr>
			</tfoot>
		</table>
	</div>
</template>
