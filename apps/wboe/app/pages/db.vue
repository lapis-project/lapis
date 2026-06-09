<script lang="ts" setup>
import type { TableColumn } from "@nuxt/ui";
import { computed, h, ref, resolveComponent } from "vue";

import type { WboeTableRow } from "~~/server/api/db.get";

const UCheckbox = resolveComponent("UCheckbox");

// --- STATE ---
const rowSelection = ref({});
const page = ref(1);
const pageSize = ref(10);
const pageSizeOptions = [5, 10, 15, 20];

// --- DATA FETCHING ---
// Notice the / before api/db so Nuxt knows it's an absolute URL!
const { data, status, error } = await useFetch("/api/db", {
	query: {
		page,
		pageSize,
	},
	watch: [page, pageSize],
});

// Safely extract the data from the API response
const tableData = computed(() => data.value?.data ?? []);
const totalCount = computed(() => data.value?.totalCount ?? 0);

// --- PAGINATION HANDLERS ---
const handlePageChange = (newPage: number) => {
	page.value = newPage;
};

const handlePageSizeChange = (size: number) => {
	pageSize.value = size;
	page.value = 1; // Kick back to page 1 to avoid empty pages
};

// --- TABLE COLUMNS ---
const columns: Array<TableColumn<WboeTableRow>> = [
	{
		id: "select",
		header: ({ table }) =>
			h(UCheckbox, {
				modelValue: table.getIsAllPageRowsSelected(),
				// Note: The property is 'indeterminate' in Nuxt UI v3 / TanStack
				indeterminate: table.getIsSomePageRowsSelected(),
				"onUpdate:modelValue": (value: boolean) => table.toggleAllPageRowsSelected(Boolean(value)),
				ariaLabel: "Select all",
			}),
		cell: ({ row }) =>
			h(UCheckbox, {
				modelValue: row.getIsSelected(),
				"onUpdate:modelValue": (value: boolean) => row.toggleSelected(Boolean(value)),
				ariaLabel: "Select row",
			}),
	},
	{ accessorKey: "lemma", header: "Lemma" },
	{ accessorKey: "wortart", header: "Wortart" },
	{ accessorKey: "lautung", header: "Lautung" },
	{ accessorKey: "bedeutungLautung", header: "Bedeutung/Lautung" },
	{
		accessorKey: "kontext",
		header: "Kontext",
		cell: ({ row }) => {
			return h(
				"div",
				{ class: "italic text-sm whitespace-pre-wrap min-w-[200px]" },
				row.getValue("kontext"),
			);
		},
	},
	{
		accessorKey: "bedeutungKontext",
		header: "Bedeutung/Kontext",
		cell: ({ row }) => {
			return h(
				"div",
				{ class: "text-xs uppercase tracking-wider whitespace-pre-wrap min-w-[200px]" },
				row.getValue("bedeutungKontext"),
			);
		},
	},
	{ accessorKey: "sigle", header: "Sigle" },
	{ accessorKey: "staat", header: "Staat" },
	{ accessorKey: "land", header: "Land" },
	{ accessorKey: "grossregion", header: "Großregion" },
	{ accessorKey: "kleinregion", header: "Kleinregion" },
	{ accessorKey: "gemeinde", header: "Gemeinde" },
];
</script>

<template>
	<div class="p-8">
		<h1 class="text-2xl font-bold mb-6">WBÖ Dictionary Data</h1>

		<UAlert
			v-if="status === 'error'"
			class="mb-4"
			color="error"
			:description="error?.message"
			title="Failed to load data"
		/>

		<div class="border rounded-md border-gray-200 dark:border-gray-700">
			<UTable
				ref="table"
				v-model:row-selection="rowSelection"
				class="flex-1"
				:columns="columns"
				:data="tableData"
				:loading="status === 'pending'"
			/>
		</div>

		<div class="flex items-center justify-between border-t border-default px-4 pt-4 mt-4">
			<div class="flex items-center gap-2">
				<span class="text-sm text-gray-500 dark:text-gray-400">Reihen pro Seite:</span>
				<USelectMenu
					class="w-20"
					color="neutral"
					:items="pageSizeOptions"
					:model-value="pageSize"
					:search-input="false"
					variant="ghost"
					@update:model-value="handlePageSizeChange"
				/>
			</div>

			<UPagination
				:items-per-page="pageSize"
				:page="page"
				show-edges
				:total="totalCount"
				@update:page="handlePageChange"
			/>
		</div>
	</div>
</template>
