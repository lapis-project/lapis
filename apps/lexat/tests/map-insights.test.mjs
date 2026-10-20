import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

import {
	countGroups,
	countRegions,
	locatePoint,
	regionalCooccurrences,
	regionalDistributions,
	surveyAnswers,
} from "../app/utils/map-insights.ts";
import { normaliseGroups } from "../app/utils/variant-groups.ts";

const groups = normaliseGroups([], ["A", "B", "C"]);
const answers = [
	{ annotation: "A", response: "a", region: "West", bundesland: "Tirol" },
	{ annotation: "A", response: "a", region: "West", bundesland: "Tirol" },
	{ annotation: "B", response: "b", region: "West", bundesland: "Tirol" },
	{ annotation: "B", response: "b", region: "East", bundesland: "Tirol" },
	{ annotation: "C", response: "c", region: "East", bundesland: "Wien" },
	{ annotation: "A", response: "a" },
	{ annotation: "C", response: "c" },
];

test("counts answers rather than locations or informants, including repeated answers", () => {
	const points = [
		{
			id: "place",
			lon: 11,
			lat: 47,
			informants: [
				{
					answers: [
						{ annotation: "A", response: "a" },
						{ annotation: "A", response: "a2" },
						{ annotation: "B", response: "b" },
					],
				},
			],
		},
	];
	const entries = surveyAnswers(points, () => ({ region: "West" }));
	assert.deepEqual(countGroups(entries, groups), { A: 2, B: 1 });
	assert.deepEqual(countRegions(entries, ["A"], "region"), { West: 2 });
	const merged = normaliseGroups([{ id: "", label: "Together", variants: ["A", "B"] }], ["A", "B"]);
	assert.deepEqual(countGroups(entries, merged), { "A,B": 3 });
	assert.equal(points[0].informants[0].answers[1].annotation, "A");
	assert.deepEqual(
		countGroups(
			entries.filter((entry) => entry.annotation === "B"),
			groups,
		),
		{ B: 1 },
	);
});

test("cooccurrences use the selected geography and exclude unknown regions and selected variants", () => {
	assert.deepEqual(regionalCooccurrences(answers, ["A"], "region", groups), { B: 1 });
	assert.deepEqual(regionalCooccurrences(answers, ["A"], "bundesland", groups), { B: 2 });
	assert.deepEqual(regionalCooccurrences(answers, ["A", "B"], "region", groups), { C: 1 });
	assert.deepEqual(regionalCooccurrences([], ["A"], "region", groups), {});
	assert.deepEqual(regionalCooccurrences(answers, [], "region", groups), {});
	assert.deepEqual(regionalDistributions(answers, "region", groups), [
		{ label: "West", total: 3, counts: { A: 2, B: 1 } },
		{ label: "East", total: 2, counts: { B: 1, C: 1 } },
	]);
});

test("normalises groups after filtering, ungrouping, and changing phenomena without duplicate membership", () => {
	const input = [
		{ id: "", label: "First", variants: ["A", "B", "removed"] },
		{ id: "", label: "Second", variants: ["B", "C"] },
	];
	const normalised = normaliseGroups(input, ["A", "B", "C", "D"]);
	assert.deepEqual(
		normalised.map((group) => group.variants),
		[["A", "B"], ["C"], ["D"]],
	);
	assert.deepEqual(
		normaliseGroups(
			normalised.filter((group) => group.id !== "A,B"),
			["A", "B", "C", "D"],
		)
			.flatMap((group) => group.variants)
			.toSorted(),
		["A", "B", "C", "D"],
	);
	assert.deepEqual(
		normaliseGroups(input, ["New"]).map((group) => group.variants),
		[["New"]],
	);
});

test("locates real Austrian points in both boundary datasets and leaves foreign points unassigned", () => {
	const regions = JSON.parse(
		readFileSync(
			new URL("../app/assets/data/dialektregionen-lexat21-optimized.geojson.json", import.meta.url),
		),
	).features;
	const states = JSON.parse(
		readFileSync(new URL("../app/assets/data/bundeslaender.json", import.meta.url)),
	).features;
	assert.equal(locatePoint([16.3738, 48.2082], states, "name"), "Wien");
	assert.equal(locatePoint([11.4041, 47.2692], states, "name"), "Tirol");
	assert.equal(locatePoint([16.3738, 48.2082], regions, "Dialektregion_Name"), "Ostmittelbairisch");
	assert.equal(locatePoint([0, 0], regions, "Dialektregion_Name"), undefined);
	assert.equal(locatePoint([0, 0], states, "name"), undefined);
});
