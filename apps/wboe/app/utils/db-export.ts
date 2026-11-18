import type { DbColumn, WboeTableRow } from "#shared/utils/db-records";

export type DbExportFormat = "csv" | "json" | "xlsx";

function csvCell(value: string) {
	// Spreadsheet programs may interpret leading formula characters in a CSV cell.
	const text = /^[\s\uFEFF]*[=+@-]|^[\t\r\n]/u.test(value) ? "'" + value : value;
	return '"' + text.replaceAll('"', '""') + '"';
}

export async function downloadDbRows(
	rows: WboeTableRow[],
	columns: readonly DbColumn[],
	format: DbExportFormat,
	collectionSources: ReadonlyMap<string, string[]>,
) {
	const hasSources = rows.some(({ id }) => collectionSources.has(id));
	const header = [...(hasSources ? ["Sammlung"] : []), ...columns.map(({ label }) => label)];
	const values = rows.map((row) => [
		...(hasSources ? [collectionSources.get(row.id)?.join(", ") ?? ""] : []),
		...columns.map(({ key }) => row[key]),
	]);
	const filename = `wboe-lioe-export.${format}`;

	if (format === "xlsx") {
		const { default: writeExcelFile } = await import("write-excel-file/browser");
		await writeExcelFile([header, ...values]).toFile(filename);
		return;
	}

	const isCsv = format === "csv";
	const contents = isCsv
		? "\uFEFF" + [header, ...values].map((row) => row.map(csvCell).join(",")).join("\r\n")
		: JSON.stringify(
				values.map((row) => Object.fromEntries(header.map((key, i) => [key, row[i]]))),
				null,
				"\t",
			);
	const url = URL.createObjectURL(
		new Blob([contents], {
			type: isCsv ? "text/csv;charset=utf-8" : "application/json",
		}),
	);
	const link = document.createElement("a");
	link.href = url;
	link.download = filename;
	link.click();
	setTimeout(() => URL.revokeObjectURL(url), 1000);
}
