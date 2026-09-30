import assert from "node:assert/strict";
import { test } from "node:test";

import { buildDatasetEntries, detectFieldMapping } from "../app/utils/dataset-import.ts";
import { datasetQuestions, datasetResponses, matchesDatasetAge } from "../app/utils/dataset.ts";
import { parseTabularText } from "../app/utils/tabular-data.ts";

const csv = `iddoc,PLZ,Ort,Kreis,Land,Latitude,Longitude,Item,Benennungsvariante,age,gender
139,6067,Absam,,,47.2965,11.5051,KEHREN,zusammenkehren,15-19,männlich
139,6067,Absam,,,47.2965,11.5051,KEHREN,sonstige,15-19,männlich
140,6067,Absam,,,47.2965,11.5051,KEHREN,kehren,20-24,weiblich
139,6067,Absam,,,47.2965,11.5051,ANDERES,anders,15-19,männlich`;

function build(text = csv) {
	const parsed = parseTabularText(text);
	return buildDatasetEntries(parsed.rows, detectFieldMapping(parsed.columns));
}

test("maps LexAT columns and preserves repeated informants, demographics, and answers", () => {
	const { entries, report } = build();
	assert.equal(report.imported, 4);
	assert.deepEqual(
		datasetQuestions(entries).map((q) => q.label),
		["KEHREN", "ANDERES"],
	);
	const responses = datasetResponses(entries, "KEHREN");
	assert.equal(responses.length, 1);
	assert.equal(responses[0].informants.length, 2);
	assert.equal(responses[0].informants[0].answers.length, 2);
	assert.equal(responses[0].informants[0].age, "15-19");
	assert.equal(responses[0].informants[0].gender, "männlich");
	assert.equal(responses[0].informants[0].answers[0].variety, "");
	assert.equal(responses[0].lat, 47.2965);
});

test("rejects unusable rows and supports semicolon files with decimal commas", () => {
	const { entries, report } = build(
		'Item;Benennungsvariante;Latitude;Longitude\nA;B;"47,2";"11,5"\nA;B;91;11\nA;;47;11\n;B;47;11',
	);
	assert.equal(entries.length, 1);
	assert.equal(entries[0].Latitude, "47.2");
	assert.equal(report.skippedCoordinates, 1);
	assert.equal(report.skippedVariable, 1);
	assert.equal(report.skippedVariant, 1);
});

test("does not merge different coordinates or anonymous respondents", () => {
	const { entries } = build(
		"Item,Benennungsvariante,Latitude,Longitude,Ort\nA,B,47,11,Same\nA,C,47,11,Same\nA,D,48,12,Same",
	);
	const responses = datasetResponses(entries, "A");
	assert.equal(responses.length, 2);
	assert.equal(responses[0].informants.length, 2);
	assert.notEqual(responses[0].id, responses[1].id);
});

test("keeps missing ages in the full map and filters ranges and individual ages", () => {
	assert.equal(matchesDatasetAge("", 0, 100), true);
	assert.equal(matchesDatasetAge("", 20, 40), false);
	assert.equal(matchesDatasetAge("20-24", 20, 40), true);
	assert.equal(matchesDatasetAge("25", 20, 40), true);
	assert.equal(matchesDatasetAge("15-19", 20, 40), false);
});

test("accepts GeoJSON points and splits multiple variants into answers", () => {
	const parsed = parseTabularText(
		JSON.stringify({
			type: "FeatureCollection",
			features: [
				{
					type: "Feature",
					geometry: { type: "Point", coordinates: [11, 47] },
					properties: { Item: "A", Benennungsvariante: ["B", "C"] },
				},
			],
		}),
	);
	const { entries } = buildDatasetEntries(parsed.rows, detectFieldMapping(parsed.columns));
	assert.equal(datasetResponses(entries, "A")[0].informants[0].answers.length, 2);
});
