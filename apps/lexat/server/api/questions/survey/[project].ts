const questions: Array<{ id: number; value: string; label: string }> = [
	{ id: 1, value: "augenlid", label: "Augenlid" },
	{ id: 2, value: "auswringen", label: "Auswringen" },
	{ id: 3, value: "backenzahn", label: "Backenzahn" },
	{ id: 4, value: "barfuss", label: "Barfuß" },
	{ id: 5, value: "bauchschmerzen", label: "Bauchschmerzen" },
	{ id: 6, value: "begraebnis", label: "Begräbnis" },
	{ id: 7, value: "brombeere", label: "Brombeere" },
	{ id: 8, value: "eidotter", label: "Eidotter" },
	{ id: 9, value: "walderdbeere", label: "Walderdbeere" },
	{ id: 10, value: "kehren", label: "Kehren" },
	{ id: 11, value: "ferkel", label: "Ferkel" },
	{ id: 12, value: "fruehling", label: "Frühling" },
	{ id: 13, value: "giesskanne", label: "Gießkanne" },
	{ id: 14, value: "oma", label: "Oma" },
	{ id: 15, value: "opa", label: "Opa" },
	{ id: 16, value: "gurke", label: "Gurke" },
	// { value: "hagebutte", label: "Hagebutte" },
	// { value: "himbeere", label: "Himbeere"},
	// { value: "knoechel", label: "Knöchel" },
	// { value: "kopfschmerzen", label: "Kopfschmerzen" },
	{ id: 17, value: "streichholz", label: "Streichholz" },
];

export default defineEventHandler(() => {
	return questions;
});
