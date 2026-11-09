import { defineStore } from "pinia";

import type { LocatedEntry } from "@/utils/dataset";
import { PILOT_DATASET_ID, pilotEntries } from "@/utils/pilot-data";

export interface CustomDataset {
	id: string;
	name: string;
	/** ISO timestamp of the upload. */
	createdAt: string;
	entries: Array<LocatedEntry>;
}

export interface DatasetInfo {
	id: string;
	name?: string;
	createdAt?: string;
	size: number;
	custom: boolean;
	hasIds: boolean;
}

const STORAGE_KEY = "lexvad.custom-datasets";

function createId() {
	if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
	return `dataset-${String(Date.now())}-${Math.random().toString(36).slice(2, 8)}`;
}

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
	const dataset = value as CustomDataset | null;
	return (
		dataset != null &&
		typeof dataset.id === "string" &&
		typeof dataset.name === "string" &&
		Array.isArray(dataset.entries)
	);
}

/**
 * Uploaded datasets never leave the browser: they live in this store and are mirrored into
 * IndexedDB, so a reload keeps them but nothing is sent to the backend.
 */
export const useDatasetStore = defineStore("datasets", () => {
	const customDatasets = shallowRef<Array<CustomDataset>>([]);
	const datasetByMap = ref<Record<string, string>>({});
	const persistenceFailed = ref(false);

	const restored = ref(false);

	const datasets = computed<Array<DatasetInfo>>(() => [
		{ id: PILOT_DATASET_ID, size: pilotEntries.length, custom: false, hasIds: true },
		...customDatasets.value.map((dataset) => ({
			id: dataset.id,
			name: dataset.name,
			createdAt: dataset.createdAt,
			size: dataset.entries.length,
			custom: true,
			hasIds: dataset.entries.some((entry) => entry.Id !== undefined),
		})),
	]);

	const hasCustomDatasets = computed(() => customDatasets.value.length > 0);

	function getDataset(id: string) {
		return customDatasets.value.find((dataset) => dataset.id === id);
	}

	function has(id: string) {
		return id === PILOT_DATASET_ID || getDataset(id) !== undefined;
	}

	function entriesFor(id: string): Array<LocatedEntry> {
		return getDataset(id)?.entries ?? pilotEntries;
	}

	function datasetInfo(id: string) {
		return datasets.value.find((dataset) => dataset.id === id) ?? datasets.value[0]!;
	}

	function datasetForMap(mapId: string) {
		const id = datasetByMap.value[mapId];
		return id !== undefined && has(id) ? id : PILOT_DATASET_ID;
	}

	function setDatasetForMap(mapId: string, id: string) {
		if (has(id)) datasetByMap.value[mapId] = id;
	}

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
			restored.value = true;
		}
	}

	async function addDataset(name: string, entries: Array<LocatedEntry>) {
		const dataset: CustomDataset = {
			id: createId(),
			name: name.trim() === "" ? "Dataset" : name.trim(),
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

	return {
		addDataset,
		customDatasets,
		datasetForMap,
		datasetInfo,
		datasets,
		entriesFor,
		has,
		hasCustomDatasets,
		persistenceFailed,
		removeDataset,
		restore,
		restored,
		setDatasetForMap,
	};
});

export function useMapDataset(mapId: string) {
	const store = useDatasetStore();

	return computed({
		get() {
			return store.datasetForMap(mapId);
		},
		set(id: string) {
			store.setDatasetForMap(mapId, id);
		},
	});
}
