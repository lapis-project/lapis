/* eslint-disable @typescript-eslint/no-unsafe-member-access */

/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-argument */
import type { ColumnDef } from "@tanstack/vue-table";
import { h } from "vue";

import type { ArticleListEntry } from "@/components/articles/articles";
import ItemActions from "@/components/articles/item-actions.vue";
import type { User } from "@/types/api";

export const columns: Array<ColumnDef<ArticleListEntry>> = [
	{
		accessorKey: "title",
		header: () => h("div", { class: "text-left" }, "Title"),
		cell: ({ row }) => h("div", { class: "text-left" }, row.getValue("title")),
	},
	{
		accessorKey: "authors",
		header: () => h("div", { class: "text-left" }, "Authors"),
		cell: ({ row }) =>
			h(
				"div",
				{ class: "text-left" },
				row
					.getValue("authors")
					.map((author: User) => nameShortener(author.firstName, author.lastName))
					.join(", "),
			),
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
		cell: ({ row }) => {
			const article = row.original;

			return h(
				"div",
				{ class: "relative" },
				h(ItemActions, {
					item: article,
				}),
			);
		},
	},
];