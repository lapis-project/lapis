export type AustrianStateId = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;
export type PostalCodeRange = readonly [lower: number, upper: number];

export const austrianStates: ReadonlyArray<{ id: AustrianStateId; name: string }> = [
	{ id: 1, name: "Burgenland" },
	{ id: 2, name: "Kärnten" },
	{ id: 3, name: "Niederösterreich" },
	{ id: 4, name: "Oberösterreich" },
	{ id: 5, name: "Salzburg" },
	{ id: 6, name: "Steiermark" },
	{ id: 7, name: "Tirol" },
	{ id: 8, name: "Vorarlberg" },
	{ id: 9, name: "Wien" },
];

// State IDs follow Austria's Bundesland codes (alphabetical order).
// State assignments: Austrian Post's PLZ Verzeichnis, September 2026.
// https://www.post.at/g/c/postlexikon
// Ranges include unassigned gaps: this mapping filters states, not PLZ validity.
export const austrianStatePostalCodeRanges: Record<
	AustrianStateId,
	ReadonlyArray<PostalCodeRange>
> = {
	1: [
		// Burgenland
		[2421, 2425],
		[2473, 2475],
		[2491, 2491],
		[7000, 7420],
		[7422, 7574],
		[8380, 8385],
	],
	2: [
		// Kärnten
		[9000, 9322],
		[9330, 9781],
		[9800, 9873],
	],
	3: [
		// Niederösterreich
		[2000, 2413],
		[2431, 2472],
		[2481, 2490],
		[2492, 3333],
		[3340, 3973],
		[4300, 4303],
		[4392, 4392],
		[4431, 4441],
		[4482, 4482],
	],
	4: [
		// Oberösterreich
		[3334, 3335],
		[4000, 4294],
		[4310, 4391],
		[4400, 4421],
		[4442, 4481],
		[4483, 4985],
		[5120, 5145],
		[5166, 5166],
		[5211, 5282],
		[5310, 5311],
		[5360, 5360],
	],
	5: [
		// Salzburg
		[5000, 5114],
		[5151, 5165],
		[5201, 5205],
		[5300, 5303],
		[5321, 5350],
		[5400, 5771],
	],
	6: [
		// Steiermark
		[7421, 7421],
		[8000, 8362],
		[8401, 8993],
		[9323, 9323],
	],
	7: [
		// Tirol, including Osttirol
		[6000, 6691],
		[9782, 9782],
		[9900, 9992],
	],
	8: [
		// Vorarlberg
		[6700, 6993],
	],
	9: [
		// Wien
		[1000, 1610],
	],
};
