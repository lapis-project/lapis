/** Makes Excel read the file as UTF-8 instead of mangling every umlaut. */
const BYTE_ORDER_MARK = String.fromCharCode(0xfeff);

export interface CsvColumn<T> {
	header: string;
	value: (row: T) => number | string | undefined;
}

function escapeCell(value: number | string | undefined) {
	const text = value === undefined ? "" : String(value);
	return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function toCsv<T>(columns: Array<CsvColumn<T>>, rows: Array<T>) {
	return [
		columns.map((column) => escapeCell(column.header)).join(","),
		...rows.map((row) => columns.map((column) => escapeCell(column.value(row))).join(",")),
	].join("\r\n");
}

export function downloadCsv(fileName: string, content: string) {
	const blob = new Blob([BYTE_ORDER_MARK, content], { type: "text/csv;charset=utf-8" });
	const url = URL.createObjectURL(blob);
	const link = document.createElement("a");
	link.href = url;
	link.download = fileName.endsWith(".csv") ? fileName : `${fileName}.csv`;
	link.click();
	URL.revokeObjectURL(url);
}
