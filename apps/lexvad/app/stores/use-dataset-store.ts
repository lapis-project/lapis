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
}

const STORAGE_KEY = "lexvad.custom-datasets";
const STORAGE_VERSION = 1;

function createId() {
	if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
	return `dataset-${String(Date.now())}-${Math.random().toString(36).slice(2, 8)}`;
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
 * Uploaded datasets never leave the browser: they live in this store and are mirrored into local
 * storage, so a reload keeps them but nothing is sent to the backend.
 */
export const useDatasetStore = defineStore("datasets", () => {
	const customDatasets = ref<Array<CustomDataset>>([]);
	const datasetByMap = ref<Record<string, string>>({});
	const persistenceFailed = ref(false);

	const datasets = computed<Array<DatasetInfo>>(() => [
		{ id: PILOT_DATASET_ID, size: pilotEntries.length, custom: false },
		...customDatasets.value.map((dataset) => ({
			id: dataset.id,
			name: dataset.name,
			createdAt: dataset.createdAt,
			size: dataset.entries.length,
			custom: true,
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

	function persist() {
		if (!import.meta.client) return;
		try {
			localStorage.setItem(
				STORAGE_KEY,
				JSON.stringify({ version: STORAGE_VERSION, datasets: customDatasets.value }),
			);
			persistenceFailed.value = false;
		} catch {
			persistenceFailed.value = true;
		}
	}

	function restore() {
		if (!import.meta.client) return;
		try {
			const stored = localStorage.getItem(STORAGE_KEY);
			if (!stored) return;
			const parsed = JSON.parse(stored) as { version?: number; datasets?: unknown };
			if (parsed.version !== STORAGE_VERSION || !Array.isArray(parsed.datasets)) return;
			customDatasets.value = parsed.datasets.filter(isDataset);
		} catch {
			localStorage.removeItem(STORAGE_KEY);
		}
	}

	function addDataset(name: string, entries: Array<LocatedEntry>) {
		const dataset: CustomDataset = {
			id: createId(),
			name: name.trim() === "" ? "Dataset" : name.trim(),
			createdAt: new Date().toISOString(),
			entries,
		};
		customDatasets.value = [...customDatasets.value, dataset];
		persist();
		return dataset;
	}

	function removeDataset(id: string) {
		customDatasets.value = customDatasets.value.filter((dataset) => dataset.id !== id);
		persist();
	}

	return {
		addDataset,
		customDatasets,
		datasetForMap,
		datasetInfo,
		datasets,
		entriesFor,
		hasCustomDatasets,
		persistenceFailed,
		removeDataset,
		restore,
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
