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
	criterion?: string;
}

const t = useTranslations();

const sortCriterion = ref("");

export type SortOder = "asc" | "desc";

const sortOrder = ref<SortOder>("asc");

const dbTable = ref<HTMLDivElement | null>(null);
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
	(event: "download-csv"): void;
}>();

const setSortCriterion = (column: TableColumn) => {
	if (column.sortable) {
		sortOrder.value = sortOrder.value === "asc" ? "desc" : "asc";
		sortCriterion.value = column.value;

		if (props.serverSideSorting && column.criterion) {
			emit("update:sortCriterion", column.criterion, sortOrder.value);
		}
	}
};

const handleDownload = () => {
	if (props.serverSideSorting) {
		emit("download-csv");
	} else {
		downloadCSV(sortedData.value, props.columns);
	}
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

const resetScroll = () => {
	if (dbTable.value) {
		// reset vertical scroll position
		dbTable.value.scrollTop = 0;
	}
};

watch(
	() => props.data,
	() => {
		if (!props.serverSideSorting) {
			sortCriterion.value = "";
			sortOrder.value = "asc";
		}
		resetScroll();
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
		<div
			ref="dbTable"
			class="relative max-h-[500px] overflow-x-auto overflow-y-scroll shadow-md sm:rounded-lg"
		>
			<table
				class="min-w-full table-fixed text-left text-sm text-gray-500 dark:text-gray-400 rtl:text-right"
			>
				<thead class="sticky top-0 bg-gray-50 text-xs uppercase text-foreground dark:bg-gray-700">
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
						class="border-b bg-white dark:border-gray-700 dark:bg-gray-800 text-foreground/80"
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
					class="sticky bottom-0 bg-gray-50 text-xs font-bold uppercase text-foreground dark:bg-gray-700"
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
			<slot name="left"></slot>
			<Button @click="handleDownload"
				><Download class="mr-2 size-4" />{{ t("DataTable.download") }}</Button
			>
			<slot name="right"></slot>
		</div>
	</section>
</template>
