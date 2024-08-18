import { defineEventHandler } from "h3";

const categories: Array<{ id: number; value: string; label: string }> = [
	{ id: 1, value: "commentary", label: "Kartenkommentar" },
	{ id: 2, value: "methodology", label: "Erhebungsmethode" },
	{ id: 3, value: "description", label: "Phänomenbeschreibung" },
];

export default defineEventHandler(() => {
	return categories;
});
