<script setup lang="ts">
import { ArrowDown, ArrowUp, ArrowUpDown, Download } from "lucide-vue-next";

const props = defineProps<{
	data: Array<TableEntry>;
	columns: Array<TableColumn>;
	serverSideSorting?: boolean;
	isLoading?: boolean;
}>();

export type TableEntry = Record<string, number | string>;

export interface TableColumn {
	label: string;
	value: string;
	sortable: boolean;
	footer?: string;
	sum?: boolean;
}

const t = useTranslations();

const sortCriterion = ref("");

export type SortOder = "asc" | "desc";

const sortOrder = ref<SortOder>("asc");

const flash = ref(false);
const flashStartTime = ref<number>(0);
const removeTimeout = ref<NodeJS.Timeout | null>(null);

const sortedData = computed(() => {
	if (!sortCriterion.value || props.serverSideSorting) {
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
	return sortedData.value.reduce((sum, item) => sum + Number(item[columnValue] ?? 0), 0);
};

const emit = defineEmits<{
	(event: "update:sortCriterion", label: string, order: SortOder): void;
}>();

const setSortCriterion = (column: TableColumn) => {
	if (column.sortable) {
		sortOrder.value = sortOrder.value === "asc" ? "desc" : "asc";
		sortCriterion.value = column.value;

		if (props.serverSideSorting) {
			emit("update:sortCriterion", column.value, sortOrder.value);
		}
	}
};

const escapeCSVValue = (value: number | string): number | string => {
	if (typeof value === "string") {
		// Escape double quotes by doubling them
		const escapedValue = value.replace(/"/g, '""');
		// Enclose the value in double quotes
		return `"${escapedValue}"`;
	}
	return value;
};

const downloadCSV = () => {
	const csvRows: Array<string> = [];

	// Add the header row
	const headerRow = props.columns.map((header) => header.label).join(",");
	csvRows.push(headerRow);

	// Add the data rows
	sortedData.value.forEach((row) => {
		const rowValues = props.columns.map((header) => escapeCSVValue(row[header.value]));
		csvRows.push(rowValues.join(","));
	});

	// Create a Blob from the CSV string
	const csvString = csvRows.join("\n");
	const blob = new Blob([csvString], { type: "text/csv" });
	const url = URL.createObjectURL(blob);

	// Create an anchor element and trigger the download
	const link = document.createElement("a");
	link.href = url;
	link.download = "table-data.csv";
	document.body.appendChild(link);
	link.click();

	// Clean up
	document.body.removeChild(link);
	URL.revokeObjectURL(url);
};

// Yes, we have to do this explicitly so that tailwind picks up the full class names
const columnWidth = computed(() => {
	switch (props.columns.length) {
		case 6:
			return "w-1/6";
		default:
		case 4:
			return "w-1/4";
	}
});

const flashClasses = computed(() => {
	// when flash is true, apply lowered opacity immediately,
	// otherwise use full opacity with a 250ms transition delay.
	return flash.value
		? "opacity-20 transition-opacity  delay-0"
		: "opacity-100 transition-opacity duration-250 delay-250";
});

watch(
	() => {
		return props.data;
	},
	() => {
		if (!props.serverSideSorting) {
			sortCriterion.value = "";
			sortOrder.value = "asc";
		}
	},
);

watch(
	() => props.isLoading,
	(newVal) => {
		if (newVal) {
			// Loading starts: record start time and enable flash immediately.
			flashStartTime.value = Date.now();
			if (removeTimeout.value) {
				clearTimeout(removeTimeout.value);
				removeTimeout.value = null;
			}
			flash.value = true;
		} else {
			// Loading stops: ensure the flash (opacity at 30%) lasts at least 250ms.
			const elapsed = Date.now() - flashStartTime.value;
			const delay = Math.max(50 - elapsed, 0);
			removeTimeout.value = setTimeout(() => {
				flash.value = false;
				removeTimeout.value = null;
			}, delay);
		}
	},
);

onMounted(() => {
	if (props.isLoading) {
		flash.value = true;
		flashStartTime.value = Date.now();
	}
});

onBeforeUnmount(() => {
	if (removeTimeout.value) {
		clearTimeout(removeTimeout.value);
	}
});
</script>

<template>
	<section>
		<div class="relative max-h-[500px] overflow-x-auto overflow-y-scroll shadow-md sm:rounded-lg">
			<table
				class="min-w-full table-fixed text-left text-sm text-gray-500 dark:text-gray-400 rtl:text-right"
			>
				<thead
					class="sticky top-0 bg-gray-50 text-xs uppercase text-gray-700 dark:bg-gray-700 dark:text-gray-400"
				>
					<tr>
						<th
							v-for="column in columns"
							:key="column.value"
							class="px-6 py-3"
							:class="columnWidth"
							scope="col"
						>
							<button
								class="inline-flex items-center gap-1 py-2"
								:class="{ 'cursor-pointer': column.sortable }"
								@click="setSortCriterion(column)"
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
				<tbody :class="flashClasses">
					<tr
						v-for="row in sortedData"
						:key="JSON.stringify(row)"
						class="border-b bg-white dark:border-gray-700 dark:bg-gray-800"
					>
						<td
							v-for="value in Object.values(row)"
							:key="value"
							class="px-6 py-4"
							:class="columnWidth"
						>
							{{ value }}
						</td>
					</tr>
				</tbody>
				<tfoot
					class="sticky bottom-0 bg-gray-50 text-xs font-bold uppercase text-gray-700 dark:bg-gray-700 dark:text-gray-400"
				>
					<tr>
						<td
							v-for="column in columns"
							:key="column.footer"
							class="px-6 py-3"
							:class="columnWidth"
							scope="col"
						>
							<template v-if="column.footer">{{ column.footer }}</template>
							<template v-else-if="column.sum">{{ totalCount(column.value) }}</template>
						</td>
					</tr>
				</tfoot>
			</table>
		</div>
		<div class="mt-3 justify-end flex gap-3">
			<Button @click="downloadCSV"
				><Download class="mr-2 size-4" />{{ t("DataTable.download") }}</Button
			>
			<slot></slot>
		</div>
	</section>
</template>
