import { describe, expect, it } from "vitest";

import type { LocatedEntry } from "@/utils/dataset";
import {
	countVariantFlow,
	type MatchedEntry,
	matchKey,
	type VariantFlowCount,
} from "@/utils/variant-flow";

function entries(key: string, ...answers: Array<Array<string>>): Array<MatchedEntry> {
	return answers.map((groups) => ({ key, groups: new Set(groups) }));
}

function repeat(key: string, group: string, count: number): Array<MatchedEntry> {
	return entries(key, ...Array.from({ length: count }, () => [group]));
}

function sorted(counts: Array<VariantFlowCount>) {
	return counts.toSorted((a, b) =>
		`${a.source}>${a.target}`.localeCompare(`${b.source}>${b.target}`),
	);
}

function rounded(counts: Array<VariantFlowCount>) {
	return counts.map((count) => ({ ...count, value: Number(count.value.toFixed(10)) }));
}

function swapped(counts: Array<VariantFlowCount>) {
	return counts.map(({ source, target, value }) => ({ source: target, target: source, value }));
}

function locatedEntry(entry: Partial<LocatedEntry>): LocatedEntry {
	return {
		iddoc: 1,
		Latitude: "0",
		Longitude: "0",
		Ort: "",
		Item: "",
		Benennungsvariante: "",
		...entry,
	};
}

// 0.01° of latitude is roughly 1.1 km.
const placeA = "47.000,15.000";
const placeB = "47.010,15.000";

describe("matchKey", () => {
	it("uses the informant id when matching by id", () => {
		expect(matchKey(locatedEntry({ iddoc: 1, Id: "42" }), "id")).toBe("42");
	});

	it("leaves entries without an informant id unmatched", () => {
		expect(matchKey(locatedEntry({ iddoc: 42 }), "id")).toBeUndefined();
	});

	it("rounds coordinates so slightly differing places share a key", () => {
		const a = locatedEntry({ Latitude: "47.0701", Longitude: "15.4391" });
		const b = locatedEntry({ Latitude: "47.07012", Longitude: "15.43912" });
		expect(matchKey(a, "location")).toBe("47.070,15.439");
		expect(matchKey(a, "location")).toBe(matchKey(b, "location"));
	});

	it("separates close places on either side of a rounding boundary", () => {
		// Known limitation of rounding: use a matching radius to bridge such gaps.
		const a = locatedEntry({ Latitude: "47.07", Longitude: "15.4395" });
		const b = locatedEntry({ Latitude: "47.07", Longitude: "15.43948" });
		expect(matchKey(a, "location")).not.toBe(matchKey(b, "location"));
	});
});

describe("countVariantFlow", () => {
	it("pairs answers of the same informant", () => {
		const left = [...entries("1", ["Oma"]), ...entries("2", ["Omi"]), ...entries("3", ["Oma"])];
		const right = [
			...entries("1", ["Oma"]),
			...entries("2", ["Oma", "Omi"]),
			...entries("4", ["Omi"]),
		];
		expect(sorted(countVariantFlow(left, right, "id"))).toEqual([
			{ source: "Oma", target: "Oma", value: 1 },
			{ source: "Omi", target: "Oma", value: 0.5 },
			{ source: "Omi", target: "Omi", value: 0.5 },
		]);
	});

	it("splits a matched place by the shares of its groups on both sides", () => {
		const left = [...repeat(placeA, "Oma", 3), ...repeat(placeA, "Omi", 1)];
		const right = [...repeat(placeA, "Oma", 2), ...repeat(placeA, "Omi", 2)];
		expect(sorted(countVariantFlow(left, right, "location"))).toEqual([
			{ source: "Oma", target: "Oma", value: 0.375 },
			{ source: "Oma", target: "Omi", value: 0.375 },
			{ source: "Omi", target: "Oma", value: 0.125 },
			{ source: "Omi", target: "Omi", value: 0.125 },
		]);
	});

	it("is not inflated by the number of informants per place", () => {
		const left = [...repeat(placeA, "Oma", 10), ...repeat(placeB, "Omi", 1)];
		const right = [...repeat(placeA, "Oma", 10), ...repeat(placeB, "Omi", 1)];
		expect(sorted(countVariantFlow(left, right, "location"))).toEqual([
			{ source: "Oma", target: "Oma", value: 1 },
			{ source: "Omi", target: "Omi", value: 1 },
		]);
	});

	it("is symmetric when the sides are swapped", () => {
		const left = [
			...repeat(placeA, "Oma", 3),
			...repeat(placeB, "Omi", 2),
			...entries(placeB, ["Oma", "Omi"]),
		];
		const right = [...repeat(placeA, "Großmutter", 2), ...repeat(placeB, "Oma", 1)];
		for (const radius of [0, 2000]) {
			// Rounded because summing in a different order can differ in the last float digits.
			expect(rounded(sorted(countVariantFlow(right, left, "location", radius)))).toEqual(
				rounded(sorted(swapped(countVariantFlow(left, right, "location", radius)))),
			);
		}
	});

	it("only matches other places within the radius", () => {
		const left = repeat(placeA, "Oma", 2);
		const right = repeat(placeB, "Omi", 3);
		expect(countVariantFlow(left, right, "location", 0)).toEqual([]);
		expect(countVariantFlow(left, right, "location", 1000)).toEqual([]);
		expect(countVariantFlow(left, right, "location", 1500)).toEqual([
			{ source: "Oma", target: "Omi", value: 1 },
		]);
	});

	it("ignores the radius when matching by id", () => {
		const left = entries("1", ["Oma"]);
		const right = entries("2", ["Omi"]);
		expect(countVariantFlow(left, right, "id", 20000)).toEqual([]);
	});

	it("counts each group of an answer with several groups towards the shares", () => {
		const left = entries(placeA, ["Oma"]);
		const right = entries(placeA, ["Oma"], ["Oma", "Omi"]);
		expect(rounded(sorted(countVariantFlow(left, right, "location")))).toEqual(
			rounded([
				{ source: "Oma", target: "Oma", value: 2 / 3 },
				{ source: "Oma", target: "Omi", value: 1 / 3 },
			]),
		);
	});
});
