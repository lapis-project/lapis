import type { DatasetEntry } from "@/utils/dataset";

export interface CustomDataset {
	id: string;
	name: string;
	createdAt: string;
	entries: Array<DatasetEntry>;
}

export const DEFAULT_DATASET_ID = "lexat";
const STORAGE_KEY = "lexat.custom-datasets";

async function openDatabase() {
	return new Promise<IDBDatabase>((resolve, reject) => {
		const request = indexedDB.open(STORAGE_KEY, 1);
		request.addEventListener("upgradeneeded", () =>
			request.result.createObjectStore("datasets", { keyPath: "id" }),
		);
		request.addEventListener("success", () => resolve(request.result));
		request.addEventListener("error", () => reject(request.error));
	});
}

async function writeDataset(dataset: CustomDataset | string) {
	const db = await openDatabase();
	try {
		await new Promise<void>((resolve, reject) => {
			const transaction = db.transaction("datasets", "readwrite");
			const store = transaction.objectStore("datasets");
			if (typeof dataset === "string") store.delete(dataset);
			else store.put(dataset);
			transaction.addEventListener("complete", () => resolve());
			transaction.addEventListener("error", () => reject(transaction.error));
			transaction.addEventListener("abort", () => reject(transaction.error));
		});
	} finally {
		db.close();
	}
}

function isDataset(value: unknown): value is CustomDataset {
	if (!value || typeof value !== "object") return false;
	const dataset = value as CustomDataset;
	return (
		typeof dataset.id === "string" &&
		dataset.id !== DEFAULT_DATASET_ID &&
		typeof dataset.name === "string" &&
		Number.isFinite(Date.parse(dataset.createdAt)) &&
		Array.isArray(dataset.entries) &&
		dataset.entries.every(
			(entry) =>
				entry &&
				[
					entry.Item,
					entry.Benennungsvariante,
					entry.Ort,
					entry.informantId,
					entry.age,
					entry.gender,
					entry.register,
				].every((value) => typeof value === "string") &&
				entry.Latitude !== "" &&
				entry.Longitude !== "" &&
				Number.isFinite(Number(entry.Latitude)) &&
				Math.abs(Number(entry.Latitude)) <= 90 &&
				Number.isFinite(Number(entry.Longitude)) &&
				Math.abs(Number(entry.Longitude)) <= 180,
		)
	);
}

/** Shared Nuxt state; custom datasets are never posted to the API. */
export function useDatasetStore() {
	const customDatasets = useState<Array<CustomDataset>>("custom-datasets", () => shallowRef([]));
	const persistenceFailed = useState("dataset-persistence-failed", () => false);

	async function restore() {
		let db: IDBDatabase | undefined;
		try {
			db = await openDatabase();
			const stored = await new Promise<Array<unknown>>((resolve, reject) => {
				const request = db!.transaction("datasets", "readonly").objectStore("datasets").getAll();
				request.addEventListener("success", () => resolve(request.result));
				request.addEventListener("error", () => reject(request.error));
			});
			customDatasets.value = stored.filter(isDataset);
		} catch {
			persistenceFailed.value = true;
		} finally {
			db?.close();
		}
	}

	async function addDataset(name: string, entries: Array<DatasetEntry>) {
		const dataset: CustomDataset = {
			id: crypto.randomUUID(),
			name: name.trim() || "Dataset",
			createdAt: new Date().toISOString(),
			entries,
		};
		customDatasets.value = [...customDatasets.value, dataset];
		try {
			await writeDataset(dataset);
			persistenceFailed.value = false;
		} catch {
			persistenceFailed.value = true;
		}
		return dataset;
	}

	async function removeDataset(id: string) {
		try {
			await writeDataset(id);
			customDatasets.value = customDatasets.value.filter((dataset) => dataset.id !== id);
			persistenceFailed.value = false;
		} catch {
			persistenceFailed.value = true;
		}
	}

	return reactive({ customDatasets, persistenceFailed, addDataset, removeDataset, restore });
}
