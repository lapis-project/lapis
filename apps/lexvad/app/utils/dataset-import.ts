import { type DataEntry, type LocatedEntry, locateEntry } from "@/utils/dataset";

export const datasetFields = [
	"Item",
	"Benennungsvariante",
	"Latitude",
	"Longitude",
	"Ort",
	"Variante",
	"Kreis",
	"Land",
	"PLZ",
] as const;

export type DatasetField = (typeof datasetFields)[number];

export const requiredDatasetFields: Array<DatasetField> = [
	"Item",
	"Benennungsvariante",
	"Latitude",
	"Longitude",
];

export type FieldMapping = Partial<Record<DatasetField, string>>;

export const MAX_DATASET_ROWS = 100_000;

const fieldAliases: Record<DatasetField, Array<string>> = {
	Item: [
		"item",
		"variable",
		"phaenomen",
		"phanomen",
		"konzept",
		"concept",
		"frage",
		"question",
		"begriff",
		"lemma",
		"stimulus",
	],
	Benennungsvariante: [
		"benennungsvariante",
		"benennung",
		"variant",
		"variants",
		"antwort",
		"answer",
		"type",
		"typ",
		"wortform",
		"bezeichnung",
	],
	Latitude: ["latitude", "lat", "breite", "breitengrad", "ycoord", "y"],
	Longitude: ["longitude", "lon", "lng", "long", "laenge", "lange", "laengengrad", "xcoord", "x"],
	Ort: ["ort", "ortsname", "place", "placename", "location", "city", "town", "gemeinde", "name"],
	Variante: ["variante", "dialektform", "notation", "schreibweise", "form", "beleg"],
	Kreis: ["kreis", "bezirk", "district", "county"],
	Land: ["land", "country", "staat", "state"],
	PLZ: ["plz", "postleitzahl", "zip", "zipcode", "postcode", "postalcode"],
};

function normalise(value: string) {
	return value
		.toLowerCase()
		.replaceAll("ä", "a")
		.replaceAll("ö", "o")
		.replaceAll("ü", "u")
		.replaceAll("ß", "ss")
		.replace(/[^a-z0-9]/g, "");
}

export function detectFieldMapping(columns: Array<string>): FieldMapping {
	const normalised = columns.map((column) => ({ column, key: normalise(column) }));
	const taken = new Set<string>();
	const mapping: FieldMapping = {};

	function claim(field: DatasetField, matches: (key: string) => boolean) {
		if (mapping[field]) return;
		const match = normalised.find((entry) => !taken.has(entry.column) && matches(entry.key));
		if (!match) return;
		taken.add(match.column);
		mapping[field] = match.column;
	}

	for (const field of datasetFields) claim(field, (key) => key === normalise(field));
	for (const field of datasetFields) claim(field, (key) => fieldAliases[field].includes(key));
	for (const field of datasetFields)
		claim(field, (key) => fieldAliases[field].some((alias) => key.includes(alias)));

	return mapping;
}

function parseCoordinate(value: string | undefined, limit: number) {
	if (!value) return undefined;
	const parsed = Number(value.trim().replace(",", "."));
	if (!Number.isFinite(parsed) || Math.abs(parsed) > limit) return undefined;
	return parsed;
}

export interface ImportReport {
	total: number;
	imported: number;
	truncated: number;
	skippedCoordinates: number;
	skippedVariable: number;
	skippedVariant: number;
	outsideRegions: number;
	variables: Array<string>;
	variants: number;
}

export interface ImportResult {
	entries: Array<LocatedEntry>;
	report: ImportReport;
}

export function buildDatasetEntries(
	rows: Array<Record<string, string>>,
	mapping: FieldMapping,
): ImportResult {
	function cell(row: Record<string, string>, field: DatasetField) {
		const column = mapping[field];
		return column ? (row[column] ?? "").trim() : "";
	}

	const entries: Array<LocatedEntry> = [];
	const report: ImportReport = {
		total: rows.length,
		imported: 0,
		truncated: 0,
		skippedCoordinates: 0,
		skippedVariable: 0,
		skippedVariant: 0,
		outsideRegions: 0,
		variables: [],
		variants: 0,
	};

	const variables = new Set<string>();
	const variants = new Set<string>();

	for (const row of rows) {
		if (entries.length >= MAX_DATASET_ROWS) {
			report.truncated++;
			continue;
		}

		const item = cell(row, "Item");
		const variant = cell(row, "Benennungsvariante");
		const latitude = parseCoordinate(cell(row, "Latitude"), 90);
		const longitude = parseCoordinate(cell(row, "Longitude"), 180);

		if (item === "") {
			report.skippedVariable++;
			continue;
		}
		if (variant === "") {
			report.skippedVariant++;
			continue;
		}
		if (latitude === undefined || longitude === undefined) {
			report.skippedCoordinates++;
			continue;
		}

		const place = cell(row, "Ort");
		const entry: DataEntry = {
			iddoc: entries.length + 1,
			Ort: place === "" ? `${latitude.toFixed(4)}, ${longitude.toFixed(4)}` : place,
			Latitude: String(latitude),
			Longitude: String(longitude),
			Item: item,
			Benennungsvariante: variant,
			Variante: cell(row, "Variante") || undefined,
			Kreis: cell(row, "Kreis") || undefined,
			Land: cell(row, "Land") || undefined,
			PLZ: cell(row, "PLZ") || undefined,
		};

		const located = locateEntry(entry);
		if (located.region === undefined) report.outsideRegions++;

		variables.add(item);
		variant.split(";").forEach((value) => {
			variants.add(value.trim());
		});
		entries.push(located);
	}

	report.imported = entries.length;
	report.variables = [...variables];
	report.variants = variants.size;

	return { entries, report };
}
