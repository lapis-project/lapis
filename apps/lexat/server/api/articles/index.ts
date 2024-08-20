import { defineEventHandler } from "h3";

import type { Article } from "@/types/api";

const articles: Array<Article> = [
	{
		id: 1,
		authors: [{ id: 1, firstName: "Agnes", lastName: "Kim" }],
		category: "commentary",
		title: "Kartenkommentar für das Phänomen Backenzahn",
		content: "string",
		abstract:
			"Lorem ipsum dolor sit amet, consetetur sadipscing elitr, sed diam nonumy eirmod tempor invidunt ut labore et dolore magna aliquyam erat, sed diam voluptua. At vero eos et accusam et justo duo dolores et ea rebum. Stet clita kasd gubergren, no sea takimata sanctus est Lorem ipsum dolor sit amet.",
		alias: "kartenkommentar-backenzahn",
		phenomenon: "backenzahn",
		project: "lapis",
		publishedAt: new Date(),
		updatedAt: new Date(),
		createdAt: new Date(),
		status: "published",
	},
	{
		id: 2,
		authors: [
			{ id: 2, firstName: "Markus", lastName: "Pluschkovits" },
			{ id: 4, firstName: "Don", lastName: "Draper" },
		],
		category: "methodology",
		title: "Beschreibung der Erhebungsmethode",
		content: "string",
		abstract:
			"Et harum quidem rerum facilis est et expedita distinctio. Nam libero tempore, cum soluta nobis est eligendi optio cumque nihil impedit quo minus id quod maxime placeat facere possimus, omnis voluptas assumenda est, omnis dolor repellendus.",
		alias: "beschreibung-der-erhebungsmethode",
		project: "lapis",
		publishedAt: new Date(),
		updatedAt: new Date(),
		createdAt: new Date(),
		status: "draft",
	},
	{
		id: 3,
		authors: [{ id: 3, firstName: "Anja", lastName: "Wittibschlager" }],
		category: "commentary",
		title: "Kartenkommentar für das Phänomen Augenlid",
		content: "string",
		abstract:
			"At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis praesentium voluptatum deleniti atque corrupti quos dolores et quas molestias excepturi sint occaecati cupiditate non provident, similique sunt in culpa qui officia deserunt mollitia animi, id est laborum et dolorum fuga.",
		alias: "kartenkommentar-augenlid",
		phenomenon: "augenlid",
		project: "lapis",
		publishedAt: new Date(),
		updatedAt: new Date(),
		createdAt: new Date(),
		status: "ready",
	},
];

export default defineEventHandler(() => {
	return articles;
});
