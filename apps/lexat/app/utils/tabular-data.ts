export interface TabularData {
	columns: Array<string>;
	rows: Array<Record<string, string>>;
}

export class TabularParseError extends Error {}

const DELIMITERS = [",", ";", "\t", "|"] as const;

function splitRows(text: string, delimiter: string): Array<Array<string>> {
	const rows: Array<Array<string>> = [];
	let row: Array<string> = [];
	let cell = "";
	let quoted = false;

	for (let i = 0; i < text.length; i++) {
		const char = text[i]!;

		if (quoted) {
			if (char !== '"') {
				cell += char;
			} else if (text[i + 1] === '"') {
				cell += '"';
				i++;
			} else {
				quoted = false;
			}
			continue;
		}

		if (char === '"' && cell === "") {
			quoted = true;
		} else if (char === delimiter) {
			row.push(cell);
			cell = "";
		} else if (char === "\n" || char === "\r") {
			if (char === "\r" && text[i + 1] === "\n") i++;
			row.push(cell);
			rows.push(row);
			row = [];
			cell = "";
		} else {
			cell += char;
		}
	}

	if (cell !== "" || row.length > 0) {
		row.push(cell);
		rows.push(row);
	}

	return rows.filter((entry) => entry.some((value) => value.trim() !== ""));
}

export function detectDelimiter(text: string): string {
	const header = text.split(/\r?\n/).find((line) => line.trim() !== "") ?? "";
	return DELIMITERS.map((delimiter) => ({
		delimiter,
		count: splitRows(header, delimiter)[0]?.length ?? 0,
	})).toSorted((a, b) => b.count - a.count)[0]!.delimiter;
}

function uniqueColumns(header: Array<string>) {
	const seen = new Set<string>();
	return header.map((name, index) => {
		const label = name.trim() === "" ? `Spalte ${String(index + 1)}` : name.trim();
		if (!seen.has(label)) {
			seen.add(label);
			return label;
		}
		let suffix = 2;
		while (seen.has(`${label} (${String(suffix)})`)) suffix++;
		const unique = `${label} (${String(suffix)})`;
		seen.add(unique);
		return unique;
	});
}

export function parseDelimitedText(text: string, delimiter?: string): TabularData {
	const rows = splitRows(text, delimiter ?? detectDelimiter(text));
	const header = rows.shift();
	if (!header) throw new TabularParseError("empty");

	const columns = uniqueColumns(header);
	return {
		columns,
		rows: rows.map((row) =>
			Object.fromEntries(columns.map((column, index) => [column, (row[index] ?? "").trim()])),
		),
	};
}

function flattenValue(value: unknown): string {
	if (value == null) return "";
	if (Array.isArray(value)) return value.map(flattenValue).join("; ");
	if (typeof value === "object") return JSON.stringify(value);
	return String(value);
}

function toRecords(value: unknown): Array<Record<string, unknown>> {
	if (Array.isArray(value))
		return value.filter((entry) => entry != null && typeof entry === "object");
	if (value == null || typeof value !== "object") return [];

	const container = value as Record<string, unknown>;
	// GeoJSON point features carry their coordinates outside of the properties.
	if (container.type === "FeatureCollection" && Array.isArray(container.features)) {
		return container.features.flatMap((feature: unknown) => {
			const entry = feature as {
				properties?: Record<string, unknown>;
				geometry?: { type?: string; coordinates?: Array<number> };
			};
			if (entry.geometry?.type !== "Point") return [];
			const [longitude, latitude] = entry.geometry.coordinates ?? [];
			return [{ ...entry.properties, longitude, latitude }];
		});
	}
	return toRecords(container.data ?? container.rows ?? container.entries);
}

export function parseJsonText(text: string): TabularData {
	let parsed: unknown;
	try {
		parsed = JSON.parse(text);
	} catch {
		throw new TabularParseError("invalid-json");
	}

	const records = toRecords(parsed);
	if (records.length === 0) throw new TabularParseError("empty");

	const columns = uniqueColumns([...new Set(records.flatMap((record) => Object.keys(record)))]);
	return {
		columns,
		rows: records.map((record) =>
			Object.fromEntries(
				Object.entries(record).map(([key, value]) => [key, flattenValue(value).trim()]),
			),
		),
	};
}

export function parseTabularText(text: string, fileName = ""): TabularData {
	const content = text.replace(/^﻿/, "").trim();
	if (content === "") throw new TabularParseError("empty");

	const isJson =
		/\.(json|geojson)$/i.test(fileName) || content.startsWith("[") || content.startsWith("{");
	return isJson ? parseJsonText(content) : parseDelimitedText(content);
}

/** Spreadsheets on Windows export in the ANSI codepage, which would mangle every umlaut. */
function decodeFile(buffer: ArrayBuffer) {
	try {
		return new TextDecoder("utf-8", { fatal: true }).decode(buffer);
	} catch {
		return new TextDecoder("windows-1252").decode(buffer);
	}
}

export async function readTabularFile(file: File): Promise<TabularData> {
	return parseTabularText(decodeFile(await file.arrayBuffer()), file.name);
}
