<script setup lang="ts">
import { ArrowDown, ArrowUp, ArrowUpDown, Download } from "lucide-vue-next";

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

const t = useTranslations();

const sortCriterion = ref("");

const sortOrder = ref<"asc" | "desc">("asc");

const flash = ref(false);

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
	return sortedData.value.reduce((sum, item) => sum + Number(item[columnValue] ?? 0), 0);
};

const setSortCriterion = (label: string) => {
	if (sortCriterion.value === label) {
		sortOrder.value = sortOrder.value === "asc" ? "desc" : "asc";
	} else {
		sortOrder.value = "desc";
	}
	sortCriterion.value = label;
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

watch(
	() => {
		return props.data;
	},
	() => {
		(sortCriterion.value = ""), (sortOrder.value = "asc");
		flash.value = true;
		// Reset the flag after 1 second (1000ms)
		setTimeout(() => (flash.value = false), 1000);
	},
);
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
							:class="columnWidth"
							class="px-6 py-3"
							scope="col"
						>
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
				<tbody :class="{ 'animate-flash': flash }">
					<tr
						v-for="row in sortedData"
						:key="JSON.stringify(row)"
						class="border-b bg-white dark:border-gray-700 dark:bg-gray-800"
					>
						<td
							v-for="value in Object.values(row)"
							:key="value"
							:class="columnWidth"
							class="px-6 py-4"
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
							:class="columnWidth"
							class="px-6 py-3"
							scope="col"
						>
							<template v-if="column.footer">{{ column.footer }}</template>
							<template v-else-if="column.sum">{{ totalCount(column.value) }}</template>
						</td>
					</tr>
				</tfoot>
			</table>
		</div>
		<div class="mt-3 text-right">
			<Button @click="downloadCSV"
				><Download class="mr-2 size-4" />{{ t("DataTable.download") }}</Button
			>
		</div>
	</section>
</template>
