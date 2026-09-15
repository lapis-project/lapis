import { describe, expect, it } from "vitest";

import { austrianStatePostalCodeRanges, austrianStates } from "@/lib/austrianPostalCodes.ts";

function matchingStates(postalCode: number): Array<number> {
	return Object.entries(austrianStatePostalCodeRanges)
		.filter(([, ranges]) =>
			ranges.some(([lower, upper]) => postalCode >= lower && postalCode <= upper),
		)
		.map(([state]) => Number(state));
}

describe("Austrian state postal-code ranges", () => {
	it("provides a state name for every postal-code mapping ID", () => {
		expect(austrianStates.map((state) => state.id)).toEqual(
			Object.keys(austrianStatePostalCodeRanges).map(Number),
		);
	});

	it.each([
		[7000, 1],
		[2421, 1],
		[2491, 1],
		[8385, 1],
		[9020, 2],
		[9322, 2],
		[9781, 2],
		[9873, 2],
		[3100, 3],
		[3333, 3],
		[4300, 3],
		[4392, 3],
		[4482, 3],
		[4020, 4],
		[3334, 4],
		[4481, 4],
		[4483, 4],
		[5120, 4],
		[5166, 4],
		[5310, 4],
		[5360, 4],
		[5020, 5],
		[5114, 5],
		[5151, 5],
		[5165, 5],
		[5201, 5],
		[5300, 5],
		[5321, 5],
		[5771, 5],
		[8010, 6],
		[7421, 6],
		[9323, 6],
		[6020, 7],
		[6691, 7],
		[9782, 7],
		[9900, 7],
		[9992, 7],
		[6700, 8],
		[6993, 8],
		[1010, 9],
		[1230, 9],
		[1300, 9],
	])("assigns PLZ %s exclusively to state %s", (postalCode, state) => {
		expect(matchingStates(postalCode)).toEqual([state]);
	});

	it("has no overlapping ranges", () => {
		const ranges = Object.values(austrianStatePostalCodeRanges)
			.flat()
			.toSorted(([left], [right]) => left - right);

		for (let index = 1; index < ranges.length; index++) {
			expect(ranges[index]![0]).toBeGreaterThan(ranges[index - 1]![1]);
		}
	});

	it.each([999, 10000, 84553])("does not assign non-Austrian PLZ %s", (postalCode) => {
		expect(matchingStates(postalCode)).toEqual([]);
	});
});
