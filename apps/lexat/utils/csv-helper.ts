export type TableEntry = Record<string, number | string>;

export interface TableColumn {
	label: string;
	value: string;
	sortable?: boolean;
	footer?: string;
	sum?: boolean;
}

/**
 * Escapes CSV values by doubling internal quotes and enclosing strings in quotes.
 * @param value - The value to escape.
 * @returns The escaped CSV value as a string.
 */
const escapeCSVValue = (value: number | string): string => {
	if (typeof value === "string") {
		// Escape double quotes by doubling them
		const escapedValue = value.replace(/"/g, '""');
		// Enclose the value in double quotes
		return `"${escapedValue}"`;
	}
	return String(value);
};

/**
 * Generates and downloads a CSV file based on the provided data and columns.
 * @param data - Array of data entries.
 * @param columns - Array of table column definitions.
 * @param fileName - Optional file name for the downloaded CSV. Defaults to "table-data.csv".
 */
export function downloadCSV(
	data: Array<TableEntry>,
	columns: Array<TableColumn>,
	fileName = "table-data.csv",
): void {
	const csvRows: Array<string> = [];

	// Create header row from column labels
	const headerRow = columns.map((column) => column.label).join(",");
	csvRows.push(headerRow);

	// Create each data row
	data.forEach((row) => {
		const rowValues = columns.map((column) => escapeCSVValue(row[column.value]));
		csvRows.push(rowValues.join(","));
	});

	// Create a Blob from the CSV string and generate a download link
	const csvString = csvRows.join("\n");
	const blob = new Blob([csvString], { type: "text/csv" });
	const url = URL.createObjectURL(blob);

	const link = document.createElement("a");
	link.href = url;
	link.download = fileName;
	document.body.appendChild(link);
	link.click();

	// Cleanup
	document.body.removeChild(link);
	URL.revokeObjectURL(url);
}
