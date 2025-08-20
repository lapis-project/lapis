import type { ColumnDef } from "@tanstack/vue-table";
import { h } from "vue";

import type { ArticleListEntry } from "@/components/articles/articles";
import ItemActions from "@/components/articles/item-actions.vue";

export const columns: Array<ColumnDef<ArticleListEntry>> = [
	{
		accessorKey: "title",
		header: () => h("div", { class: "text-left" }, "Title"),
		cell: ({ row }) => h("div", { class: "text-left" }, row.getValue("title")),
	},
	{
		accessorKey: "category",
		header: () => h("div", { class: "text-left" }, "Category"),
		cell: ({ row }) => h("div", { class: "text-left" }, row.getValue("category")),
	},
	{
		accessorKey: "status",
		header: () => h("div", { class: "text-left" }, "Status"),
		cell: ({ row }) => h("div", { class: "text-left" }, row.getValue("status")),
	},
	{
		id: "actions",
		enableHiding: false,
		cell: ({ row, table }) => {
			const article = row.original;
			const fn = (table.options.meta as { deleteArticle: (id: number) => Promise<void> })
				.deleteArticle;
			return h(
				"div",
				{ class: "relative" },
				h(ItemActions, {
					item: article,
					onDelete: fn,
				}),
			);
		},
	},
];
