import { defineEventHandler } from "h3";

const categories: Array<{ id: number; value: string; label: string }> = [
	{ id: 1, value: "commentary", label: "Kartenkommentar" },
	{ id: 2, value: "methodology", label: "Methodenbeschreibung" },
	{ id: 3, value: "project", label: "Projektbeschreibung" },
];

export default defineEventHandler(() => {
	return categories;
});
