import assert from "node:assert/strict";

import { describe, test } from "vitest";

import {
	createKrigingModel,
	fitVariogram,
	krige,
	type KrigingLocation,
	type KrigingSample,
} from "../app/utils/kriging.ts";
import reference from "./fixtures/kriging-reference.json" with { type: "json" };

const bounds: [number, number, number, number] = [10, 47, 12, 48];

/** Deterministic PRNG (mulberry32) so synthetic datasets are reproducible. */
function random(seed: number) {
	return () => {
		seed = (seed + 0x6d2b79f5) | 0;
		let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

/** Random samples within `bounds`; `category` decides each sample's single variant. */
function samples(
	count: number,
	category: (longitude: number, latitude: number, next: () => number) => number,
	categoryCount = 2,
	seed = 1,
): Array<KrigingSample> {
	const next = random(seed);
	return Array.from({ length: count }, () => {
		const longitude = bounds[0] + next() * (bounds[2] - bounds[0]);
		const latitude = bounds[1] + next() * (bounds[3] - bounds[1]);
		const k = category(longitude, latitude, next);
		return {
			coordinates: [longitude, latitude],
			shares: Array.from({ length: categoryCount }, (_, i) => (i === k ? 1 : 0)),
		};
	});
}

const westEast = (longitude: number) => (longitude < 11 ? 0 : 1);

function locationsFrom(input: Array<KrigingSample>): Array<KrigingLocation> {
	return input.map(({ coordinates: [longitude, latitude], shares }) => ({
		x: longitude * 75_000,
		y: latitude * 111_000,
		shares: Float64Array.from(shares),
	}));
}

const nuggetRatio = ({ nugget, sill }: { nugget: number; sill: number }) =>
	nugget / (nugget + sill);

function columnOf(result: ReturnType<typeof krige>, longitude: number) {
	return Math.floor(((longitude - bounds[0]) / (bounds[2] - bounds[0])) * result.width);
}

describe("createKrigingModel", () => {
	const locations: Array<KrigingLocation> = reference.locations.map((location) => ({
		...location,
		shares: Float64Array.from(location.shares),
	}));
	const categoryCount = reference.categories.length;

	for (const { variogram, queries } of reference.cases) {
		const evaluate = createKrigingModel(locations, variogram, categoryCount);
		const label = `nugget ${variogram.nugget}, sill ${variogram.sill}, range ${variogram.range}`;

		test(`matches PyKrige ordinary kriging (${label})`, () => {
			const estimate = new Float64Array(categoryCount);
			for (const query of queries) {
				evaluate(query.x, query.y, estimate);
				query.estimate.forEach((expected, k) =>
					assert.ok(
						Math.abs(estimate[k]! - expected) < 1e-9,
						`category ${k} at (${query.x}, ${query.y}): ${estimate[k]} ≠ ${expected}`,
					),
				);
			}
		});

		test(`estimates of all categories sum to 1 (${label})`, () => {
			const estimate = new Float64Array(categoryCount);
			for (const query of queries) {
				evaluate(query.x, query.y, estimate);
				const total = estimate.reduce((sum, value) => sum + value, 0);
				assert.ok(Math.abs(total - 1) < 1e-9, `sum is ${total}`);
			}
		});

		test(`reproduces the data at sample locations (${label})`, () => {
			const estimate = new Float64Array(categoryCount);
			for (const location of locations.slice(0, 20)) {
				evaluate(location.x, location.y, estimate);
				location.shares.forEach((share, k) => assert.ok(Math.abs(estimate[k]! - share) < 1e-9));
			}
		});
	}
});

describe("fitVariogram", () => {
	test("attributes spatially structured data mostly to the structured component", () => {
		const variogram = fitVariogram(locationsFrom(samples(400, westEast)));
		assert.ok(variogram.sill > 0);
		assert.ok(nuggetRatio(variogram) < 0.2, `nugget ratio ${nuggetRatio(variogram)}`);
	});

	test("attributes spatially random data mostly to the nugget", () => {
		const variogram = fitVariogram(
			locationsFrom(samples(400, (_, __, next) => (next() < 0.5 ? 0 : 1))),
		);
		assert.ok(nuggetRatio(variogram) > 0.8, `nugget ratio ${nuggetRatio(variogram)}`);
	});
});

describe("krige", () => {
	const columns = 40;

	test("derives the grid height from the Mercator aspect ratio", () => {
		const result = krige({
			categories: ["a", "b"],
			samples: samples(50, westEast),
			bounds,
			columns,
		});
		assert.equal(result.width, columns);
		// One degree of latitude at 47.5° spans about 1.48 degrees of longitude in Mercator.
		assert.equal(result.height, Math.round((columns / 2) * 1.48));
		assert.equal(result.dominant.length, result.width * result.height);
	});

	test("picks the dominant category on each side of a boundary", () => {
		const result = krige({
			categories: ["a", "b"],
			samples: samples(300, westEast),
			bounds,
			columns,
		});
		const row = Math.floor(result.height / 2);
		const west = row * result.width + columnOf(result, 10.3);
		const east = row * result.width + columnOf(result, 11.7);
		assert.equal(result.dominant[west], 0);
		assert.equal(result.dominant[east], 1);
		assert.ok(result.margin[west]! > 0.8);
		assert.ok(result.margin[east]! > 0.8);

		// The least certain cell of the row lies at the boundary.
		const margins = result.margin.slice(row * result.width, (row + 1) * result.width);
		const leastCertain = margins.indexOf(Math.min(...margins));
		assert.ok(Math.abs(leastCertain - columnOf(result, 11)) <= 1, `at column ${leastCertain}`);
		assert.ok(margins[leastCertain]! < 0.5);
	});

	test("shares of mixed locations count towards each of their categories", () => {
		const mixed = samples(200, () => 0, 3).map((sample) => ({
			...sample,
			shares: [0.6, 0.4, 0],
		}));
		const result = krige({ categories: ["a", "b", "c"], samples: mixed, bounds, columns });
		assert.ok(result.dominant.every((category) => category === 0));
		result.margin.forEach((margin) => assert.ok(Math.abs(margin - 0.2) < 1e-6));
	});

	test("upsamples the output grid by the given factor", () => {
		const input = { categories: ["a", "b"], samples: samples(100, westEast), bounds, columns };
		const coarse = krige(input);
		const fine = krige({ ...input, upsample: 4 });
		assert.equal(fine.width, coarse.width * 4);
		assert.equal(fine.height, coarse.height * 4);
		assert.equal(fine.dominant.length, fine.width * fine.height);
	});

	test("interpolates probabilities so that boundaries are smooth instead of stair-stepped", () => {
		// Diagonal boundary from the south-west to the north-east corner of `bounds`.
		const diagonal = (longitude: number, latitude: number) =>
			latitude - bounds[1] > (longitude - bounds[0]) / 2 ? 0 : 1;
		const result = krige({
			categories: ["a", "b"],
			samples: samples(800, diagonal),
			bounds,
			columns,
			upsample: 4,
		});

		const boundaries: Array<number> = [];
		for (let row = result.height / 4; row < (result.height * 3) / 4; row++) {
			const cells = result.dominant.slice(row * result.width, (row + 1) * result.width);
			boundaries.push(cells.indexOf(1));
		}
		// The boundary moves by about 1.3 pixels per row. Nearest-neighbour upsampling of the kriged
		// cells would keep it in place for 3 of every 4 rows and then jump (a staircase).
		const unchanged = boundaries.slice(1).filter((column, i) => column === boundaries[i]).length;
		assert.ok(
			unchanged / (boundaries.length - 1) < 0.4,
			`${unchanged} of ${boundaries.length - 1}`,
		);
	});

	test("is fully certain with a single category", () => {
		const result = krige({
			categories: ["a"],
			samples: samples(20, () => 0, 1),
			bounds,
			columns,
		});
		assert.ok(result.dominant.every((category) => category === 0));
		assert.ok(result.margin.every((margin) => margin === 1));
	});

	test("merges duplicate coordinates instead of failing on a singular matrix", () => {
		const input = samples(50, westEast);
		const result = krige({
			categories: ["a", "b"],
			samples: [...input, ...input.map((sample) => ({ ...sample, shares: [0.5, 0.5] }))],
			bounds,
			columns,
		});
		assert.ok(result.margin.every(Number.isFinite));
	});

	test("bins large datasets and still finds the boundary", () => {
		const result = krige({
			categories: ["a", "b"],
			samples: samples(3000, westEast),
			bounds,
			columns: 20,
		});
		const row = Math.floor(result.height / 2);
		assert.equal(result.dominant[row * result.width + columnOf(result, 10.3)], 0);
		assert.equal(result.dominant[row * result.width + columnOf(result, 11.7)], 1);
	});

	test("only estimates cells inside the clip polygon, plus one cell of padding", () => {
		const clip: Array<Array<[number, number]>> = [
			[
				[10.5, 47.25],
				[11.5, 47.25],
				[11.5, 47.75],
				[10.5, 47.75],
				[10.5, 47.25],
			],
		];
		const result = krige({
			categories: ["a", "b"],
			samples: samples(200, westEast),
			bounds,
			columns,
			clip,
		});
		const row = Math.floor(result.height / 2);
		const at = (longitude: number) =>
			result.margin[row * result.width + columnOf(result, longitude)]!;
		assert.equal(at(10.05), 0);
		assert.equal(at(11.95), 0);
		assert.ok(at(10.6) > 0);
		assert.ok(at(11.4) > 0);
		assert.ok(result.margin.slice(0, result.width).every((margin) => margin === 0));
	});
});
