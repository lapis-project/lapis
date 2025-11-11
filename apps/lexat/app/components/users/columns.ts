import type { ColumnDef } from "@tanstack/vue-table";
import { h } from "vue";

import UserItemActions from "@/components/users/user-item-actions.vue";
import type { UserTableEntry } from "@/components/users/users";

export const columns: Array<ColumnDef<UserTableEntry>> = [
	// {
	// 	accessorKey: "id",
	// 	header: () => h("div", { class: "text-left" }, "ID"),
	// 	cell: ({ row }) => h("div", { class: "text-left" }, row.getValue("id")),
	// },
	{
		accessorKey: "username",
		header: () => h("div", { class: "text-left" }, "Username"),
		cell: ({ row }) => h("div", { class: "text-left" }, row.getValue("username")),
	},
	{
		accessorKey: "email",
		header: () => h("div", { class: "text-left" }, "Email"),
		cell: ({ row }) => h("div", { class: "text-left" }, row.getValue("email")),
	},
	{
		accessorKey: "firstname",
		header: () => h("div", { class: "text-left" }, "Firstname"),
		cell: ({ row }) => h("div", { class: "text-left" }, row.getValue("firstname")),
	},
	{
		accessorKey: "lastname",
		header: () => h("div", { class: "text-left" }, "Lastname"),
		cell: ({ row }) => h("div", { class: "text-left" }, row.getValue("lastname")),
	},
	{
		accessorKey: "role_name",
		header: () => h("div", { class: "text-left" }, "Role"),
		cell: ({ row }) => h("div", { class: "text-left" }, row.getValue("role_name")),
	},
	{
		id: "actions",
		enableHiding: false,
		cell: ({ row, table }) => {
			const user = row.original;
			const fn = table.options.meta?.refresh as () => Promise<void>;
			return h(
				"div",
				{ class: "relative" },
				h(UserItemActions, {
					item: user,
					refresh: fn,
				}),
			);
		},
	},
];
