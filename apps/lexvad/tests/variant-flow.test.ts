import { describe, expect, it } from "vitest";

import type { LocatedEntry } from "@/utils/dataset";
import {
	associationStrength,
	countEntryOverlap,
	countVariantFlow,
	entriesInFlow,
	type MatchedEntry,
	matchKey,
	pairEntries,
	variantFlowAssociation,
	type VariantFlowCount,
} from "@/utils/variant-flow";

function entries(key: string, ...answers: Array<Array<string>>): Array<MatchedEntry> {
	return answers.map((groups, index) => ({
		id: `${key}#${String(index)}`,
		key,
		groups: new Set(groups),
	}));
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
		const left = entries(placeA, ["Oma"], ["Oma"], ["Oma"], ["Omi"]);
		const right = entries(placeA, ["Oma"], ["Oma"], ["Omi"], ["Omi"]);
		expect(sorted(countVariantFlow(left, right, "location"))).toEqual([
			{ source: "Oma", target: "Oma", value: 1.5 },
			{ source: "Oma", target: "Omi", value: 1.5 },
			{ source: "Omi", target: "Oma", value: 0.5 },
			{ source: "Omi", target: "Omi", value: 0.5 },
		]);
	});

	it("weights a place by its number of entries", () => {
		const left = [...repeat(placeA, "Oma", 10), ...repeat(placeB, "Omi", 1)];
		const right = [...repeat(placeA, "Oma", 10), ...repeat(placeB, "Omi", 1)];
		expect(sorted(countVariantFlow(left, right, "location"))).toEqual([
			{ source: "Oma", target: "Oma", value: 10 },
			{ source: "Omi", target: "Omi", value: 1 },
		]);
	});

	it("splits an entry across its partners within the radius", () => {
		const left = [{ id: "1", key: placeA, groups: new Set(["Oma"]) }];
		const right = [
			{ id: "2", key: placeA, groups: new Set(["Omi"]) },
			{ id: "3", key: placeB, groups: new Set(["Oida"]) },
		];
		expect(sorted(countVariantFlow(left, right, "location", 1500))).toEqual([
			{ source: "Oma", target: "Oida", value: 1.5 },
			{ source: "Oma", target: "Omi", value: 1.5 },
		]);
	});

	it("adds up to the number of common entries", () => {
		const left = [...repeat(placeA, "Oma", 3), ...repeat(placeB, "Omi", 2)];
		const right = [...repeat(placeA, "Oma", 1), ...repeat(placeB, "Oma", 4)];
		for (const radius of [0, 2000]) {
			const total = countVariantFlow(left, right, "location", radius).reduce(
				(sum, { value }) => sum + value,
				0,
			);
			expect(total).toBeCloseTo(countEntryOverlap(left, right, "location", radius).common);
		}
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
			{ source: "Oma", target: "Omi", value: 5 },
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
				{ source: "Oma", target: "Oma", value: 4 / 3 },
				{ source: "Oma", target: "Omi", value: 2 / 3 },
			]),
		);
	});
});

describe("countEntryOverlap", () => {
	it("counts shared and one-sided ids", () => {
		const left = [...entries("1", ["Oma"]), ...entries("2", ["Omi"]), ...entries("3", ["Oma"])];
		const right = [...entries("1", ["Oma"]), ...entries("4", ["Omi"])];
		expect(countEntryOverlap(left, right, "id")).toEqual({
			common: 1,
			onlyLeft: 2,
			onlyRight: 1,
		});
	});

	it("counts entries at the same place separately", () => {
		const left = [
			{ id: "1", key: placeA, groups: new Set(["Oma"]) },
			{ id: "2", key: placeA, groups: new Set(["Oma"]) },
		];
		const right = [
			{ id: "1", key: placeA, groups: new Set(["Omi"]) },
			{ id: "2", key: placeA, groups: new Set(["Omi"]) },
		];
		expect(countEntryOverlap(left, right, "location")).toEqual({
			common: 2,
			onlyLeft: 0,
			onlyRight: 0,
		});
	});

	it("counts entries with different ids at a matched place on both sides", () => {
		const left = [{ id: "1", key: placeA, groups: new Set(["Oma"]) }];
		const right = [
			{ id: "2", key: placeA, groups: new Set(["Omi"]) },
			{ id: "3", key: placeA, groups: new Set(["Omi"]) },
		];
		expect(countEntryOverlap(left, right, "location")).toEqual({
			common: 3,
			onlyLeft: 0,
			onlyRight: 0,
		});
	});

	it("counts answers of the same id once", () => {
		const left = [
			{ id: "1", key: placeA, groups: new Set(["Oma"]) },
			{ id: "1", key: placeA, groups: new Set(["Omi"]) },
		];
		const right = [{ id: "1", key: placeA, groups: new Set(["Oma"]) }];
		expect(countEntryOverlap(left, right, "location")).toEqual({
			common: 1,
			onlyLeft: 0,
			onlyRight: 0,
		});
	});

	it("counts unmatched entries by id", () => {
		const left = [
			{ id: "1", key: placeA, groups: new Set(["Oma"]) },
			{ id: "2", key: placeA, groups: new Set(["Oma"]) },
		];
		const right = [{ id: "3", key: placeB, groups: new Set(["Omi"]) }];
		expect(countEntryOverlap(left, right, "location")).toEqual({
			common: 0,
			onlyLeft: 2,
			onlyRight: 1,
		});
	});

	it("counts an entry once however many partners it has within the radius", () => {
		const left = [{ id: "1", key: placeA, groups: new Set(["Oma"]) }];
		const right = [
			{ id: "1", key: placeA, groups: new Set(["Omi"]) },
			{ id: "2", key: placeB, groups: new Set(["Omi"]) },
		];
		expect(countEntryOverlap(left, right, "location", 1500)).toEqual({
			common: 2,
			onlyLeft: 0,
			onlyRight: 0,
		});
	});

	it("bridges places within the radius", () => {
		const left = repeat(placeA, "Oma", 1);
		const right = repeat(placeB, "Omi", 1);
		expect(countEntryOverlap(left, right, "location", 0)).toEqual({
			common: 0,
			onlyLeft: 1,
			onlyRight: 1,
		});
		expect(countEntryOverlap(left, right, "location", 1500)).toEqual({
			common: 2,
			onlyLeft: 0,
			onlyRight: 0,
		});
	});
});

describe("variantFlowAssociation", () => {
	it("is 1 for a perfect association", () => {
		expect(
			variantFlowAssociation([
				{ source: "a", target: "x", value: 5 },
				{ source: "b", target: "y", value: 3 },
			]),
		).toEqual({ cramersV: 1, rows: 2, columns: 2 });
	});

	it("is 0 for independent sides", () => {
		const { cramersV } = variantFlowAssociation([
			{ source: "a", target: "x", value: 2 },
			{ source: "a", target: "y", value: 2 },
			{ source: "b", target: "x", value: 1 },
			{ source: "b", target: "y", value: 1 },
		]);
		expect(cramersV).toBeCloseTo(0);
	});

	it("matches a hand-computed table", () => {
		// chi² = 16.67 with n = 100 for [[30, 20], [10, 40]] gives V = sqrt(16.67 / 100).
		const { cramersV } = variantFlowAssociation([
			{ source: "a", target: "x", value: 30 },
			{ source: "a", target: "y", value: 20 },
			{ source: "b", target: "x", value: 10 },
			{ source: "b", target: "y", value: 40 },
		]);
		expect(cramersV).toBeCloseTo(Math.sqrt(16.6667 / 100), 3);
	});

	it("is undefined with fewer than two groups on a side", () => {
		expect(
			variantFlowAssociation([
				{ source: "a", target: "x", value: 2 },
				{ source: "a", target: "y", value: 2 },
			]),
		).toEqual({ cramersV: undefined, rows: 1, columns: 2 });
		expect(variantFlowAssociation([]).cramersV).toBeUndefined();
	});
});

describe("entriesInFlow", () => {
	const place = "48.000,16.000";
	const nearby = "48.010,16.000";

	it("finds the entries of one flow at a shared place", () => {
		const left = entries(place, ["a"], ["x"]);
		const right = entries(place, ["b"], ["y"]);
		expect(entriesInFlow(left, right, "a", "y", "location")).toEqual({
			left: new Set([`${place}#0`]),
			right: new Set([`${place}#1`]),
		});
	});

	it("skips entries whose place has no partner", () => {
		const left = [...entries(place, ["a"]), ...entries(nearby, ["a"])];
		const right = entries(place, ["b"]);
		expect(entriesInFlow(left, right, "a", "b", "location")).toEqual({
			left: new Set([`${place}#0`]),
			right: new Set([`${place}#0`]),
		});
	});

	it("finds every matched entry when both sides are left out", () => {
		const far = "49.000,16.000";
		const left = [...entries(place, ["a"]), ...entries(far, ["a"])];
		const right = entries(nearby, ["b"]);
		expect(entriesInFlow(left, right, undefined, undefined, "location")).toEqual({
			left: new Set(),
			right: new Set(),
		});
		expect(entriesInFlow(left, right, undefined, undefined, "location", 2000)).toEqual({
			left: new Set([`${place}#0`]),
			right: new Set([`${nearby}#0`]),
		});
	});

	it("covers all flows of a variant when the other side is left out", () => {
		const left = [...entries(place, ["a"], ["x"]), ...entries(nearby, ["x"])];
		const right = [...entries(place, ["b"], ["y"]), ...entries(nearby, ["b"])];
		expect(entriesInFlow(left, right, "a", undefined, "location")).toEqual({
			left: new Set([`${place}#0`]),
			right: new Set([`${place}#0`, `${place}#1`]),
		});
		expect(entriesInFlow(left, right, undefined, "y", "location")).toEqual({
			left: new Set([`${place}#0`, `${place}#1`]),
			right: new Set([`${place}#1`]),
		});
	});

	it("follows the radius", () => {
		const left = entries(place, ["a"]);
		const right = entries(nearby, ["b"]);
		expect(entriesInFlow(left, right, "a", "b", "location").left.size).toBe(0);
		expect(entriesInFlow(left, right, "a", "b", "location", 2000)).toEqual({
			left: new Set([`${place}#0`]),
			right: new Set([`${nearby}#0`]),
		});
	});
});

function key(entry: string) {
	return entry.split("#")[0];
}

describe("pairEntries", () => {
	it("pairs entries with the same key", () => {
		expect(pairEntries(["a#1"], ["a#2"], key)).toEqual([{ left: "a#1", right: "a#2" }]);
	});

	it("pairs several entries at a key in order and keeps the rest on their own", () => {
		expect(pairEntries(["a#1", "a#2"], ["a#3", "a#4", "a#5"], key)).toEqual([
			{ left: "a#1", right: "a#3" },
			{ left: "a#2", right: "a#4" },
			{ left: undefined, right: "a#5" },
		]);
	});

	it("keeps entries without a partner", () => {
		expect(pairEntries(["a#1"], ["b#1"], key)).toEqual([
			{ left: "a#1", right: undefined },
			{ left: undefined, right: "b#1" },
		]);
	});

	it("never pairs entries without a key", () => {
		expect(pairEntries(["x"], ["y"], () => undefined)).toEqual([
			{ left: "x", right: undefined },
			{ left: undefined, right: "y" },
		]);
	});
});

describe("associationStrength", () => {
	it("classifies around the thresholds", () => {
		expect(associationStrength(0.29)).toBe("weak");
		expect(associationStrength(0.3)).toBe("medium");
		expect(associationStrength(0.34)).toBe("medium");
		expect(associationStrength(0.5)).toBe("strong");
	});
});
