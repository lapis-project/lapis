import type { DataEntry, LocatedEntry } from "@/utils/dataset";

/** Fields read from the data itself; `iddoc` is assigned on import. */
export type DatasetField = Exclude<keyof DataEntry, "iddoc">;

/** Fields derived from the coordinates on import. */
export type DerivedField = Exclude<keyof LocatedEntry, keyof DataEntry>;

export type EntryField = DatasetField | DerivedField;

interface FieldDefinition {
	/** Rows without this field are skipped on upload. */
	required?: boolean;
	/** Normalised column names (lower case, no umlauts or separators) an upload is matched to. */
	aliases: Array<string>;
}

/**
 * Every field of a dataset in one place. The key is the property on an entry and also the column
 * name in the pilot data, the name an upload is matched to first and the header of the CSV export,
 * so an exported file can be uploaded again. Its label lives under `DatasetFields` in the
 * messages.
 *
 * The order is the order of the upload's column mapping and of the CSV export.
 */
const definitions: Record<DatasetField, FieldDefinition> = {
	Item: {
		required: true,
		aliases: [
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
	},
	Benennungsvariante: {
		required: true,
		aliases: [
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
	},
	Latitude: {
		required: true,
		aliases: ["latitude", "lat", "breite", "breitengrad", "ycoord", "y"],
	},
	Longitude: {
		required: true,
		aliases: ["longitude", "lon", "lng", "long", "laenge", "lange", "laengengrad", "xcoord", "x"],
	},
	Ort: {
		aliases: [
			"ort",
			"ortsname",
			"place",
			"placename",
			"location",
			"city",
			"town",
			"gemeinde",
			"name",
		],
	},
	Variante: { aliases: ["variante", "dialektform", "notation", "schreibweise", "form", "beleg"] },
	Kreis: { aliases: ["kreis", "bezirk", "district", "county"] },
	Land: { aliases: ["land", "country", "staat", "state"] },
	PLZ: { aliases: ["plz", "postleitzahl", "zip", "zipcode", "postcode", "postalcode"] },
	Id: {
		aliases: ["id", "iddoc", "informant", "informantid", "sprecher", "speaker", "gewahrsperson"],
	},
};

export const datasetFields = Object.keys(definitions) as Array<DatasetField>;

export const requiredDatasetFields = datasetFields.filter((field) => definitions[field].required);

export const optionalDatasetFields = datasetFields.filter((field) => !definitions[field].required);

const derived: Record<DerivedField, true> = { bundesland: true, region: true };

export const derivedFields = Object.keys(derived) as Array<DerivedField>;

export function fieldAliases(field: DatasetField): Array<string> {
	return definitions[field].aliases;
}

/** Columns of the CSV export, named like the fields so the file can be uploaded again. */
export const exportFields: Array<EntryField> = [...datasetFields, ...derivedFields];
