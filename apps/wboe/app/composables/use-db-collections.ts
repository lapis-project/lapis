import { useLocalStorage } from "@vueuse/core";
import { computed, ref, shallowRef, toValue, watch, type MaybeRefOrGetter } from "vue";

import { isWboeTableRow, type WboeTableRow } from "#shared/utils/db-records";

export interface DbRemoteCollection {
	id: string;
	name: string;
	description: string;
}

export interface DbLocalCollection {
	id: string;
	name: string;
	rows: WboeTableRow[];
}

interface DbCollectionBackup {
	version: 1;
	name: string;
	rows: WboeTableRow[];
}

const maximumBackupSize = 5 * 1024 * 1024;
const remoteCopyPageSize = 500;
export const dbRemoteCopyLimit = 1000;

function mergeRows(rows: WboeTableRow[]) {
	return Array.from(new Map(rows.map((row) => [row.id, row])).values());
}

export async function readDbCollection(file: File): Promise<DbCollectionBackup> {
	if (file.size > maximumBackupSize) throw new Error("Collection backup is too large");
	const backup: unknown = JSON.parse(await file.text());
	if (
		!backup ||
		typeof backup !== "object" ||
		!("version" in backup) ||
		backup.version !== 1 ||
		!("name" in backup) ||
		typeof backup.name !== "string" ||
		!backup.name.trim() ||
		backup.name.trim().length > 120 ||
		!("rows" in backup) ||
		!Array.isArray(backup.rows) ||
		!backup.rows.every(isWboeTableRow)
	) {
		throw new Error("Invalid collection backup");
	}
	return { version: 1, name: backup.name.trim(), rows: backup.rows };
}

export async function readRemoteDbCollection(id: string, signal: AbortSignal) {
	const loadPage = (page: number) =>
		$fetch<{ data: WboeTableRow[]; totalCount: number }>("/api/db", {
			body: { collectionIds: [id], page, pageSize: remoteCopyPageSize },
			method: "POST",
			signal,
		});
	const { data, totalCount } = await loadPage(1);
	if (totalCount > dbRemoteCopyLimit) return null;
	if (totalCount <= remoteCopyPageSize) return data;
	const nextPage = await loadPage(2);
	if (nextPage.totalCount > dbRemoteCopyLimit) return null;
	return mergeRows([...data, ...nextPage.data]);
}

export function useDbCollections(remoteIds: MaybeRefOrGetter<readonly string[]>) {
	const storageError = ref(false);
	const localCollections = useLocalStorage<DbLocalCollection[]>("wboe-db-collections", [], {
		initOnMounted: true,
		shallow: true,
		writeDefaults: false,
		onError: () => (storageError.value = true),
	});
	const activeLocalIds = ref<string[]>([]);
	const activeLocalCollections = computed(() => {
		const ids = new Set(activeLocalIds.value);
		return localCollections.value.filter((collection) => ids.has(collection.id));
	});
	const localSources = computed(() => {
		const sources = new Map<string, string[]>();
		for (const { name, rows } of activeLocalCollections.value) {
			for (const { id } of rows) {
				const names = sources.get(id) ?? [];
				if (!names.includes(name)) names.push(name);
				sources.set(id, names);
			}
		}
		return sources;
	});
	const localRows = computed(() =>
		mergeRows(activeLocalCollections.value.flatMap(({ rows }) => rows)),
	);

	function createCollection(name: string, rows: WboeTableRow[] = []) {
		const id = crypto.randomUUID();
		const collection = { id, name: name.trim(), rows: mergeRows(rows) };
		localCollections.value = [...localCollections.value, collection];
		activeLocalIds.value = [...activeLocalIds.value, id];
		return id;
	}

	function addToCollection(id: string, rows: WboeTableRow[]) {
		localCollections.value = localCollections.value.map((collection) =>
			collection.id === id
				? { ...collection, rows: mergeRows([...collection.rows, ...rows]) }
				: collection,
		);
	}

	function renameCollection(id: string, name: string) {
		localCollections.value = localCollections.value.map((collection) =>
			collection.id === id ? { ...collection, name: name.trim() } : collection,
		);
	}

	function removeCollection(id: string) {
		localCollections.value = localCollections.value.filter((collection) => collection.id !== id);
		activeLocalIds.value = activeLocalIds.value.filter((activeId) => activeId !== id);
	}

	function importCollection({ name, rows }: DbCollectionBackup) {
		createCollection(name, rows);
	}

	function exportCollection(id: string) {
		const collection = localCollections.value.find((item) => item.id === id);
		if (!collection) return;
		const backup = {
			version: 1,
			name: collection.name,
			rows: collection.rows,
		} satisfies DbCollectionBackup;
		const url = URL.createObjectURL(
			new Blob([JSON.stringify(backup, null, "\t")], { type: "application/json" }),
		);
		const link = document.createElement("a");
		link.href = url;
		link.download = `${collection.name}.wboe.json`;
		link.click();
		setTimeout(() => URL.revokeObjectURL(url), 1000);
	}

	const remoteCache = shallowRef(new Map<string, DbRemoteCollection>());
	const remoteCollections = computed(() =>
		toValue(remoteIds).map(
			(id) => remoteCache.value.get(id) ?? { id, name: `#${id}`, description: "" },
		),
	);

	function rememberRemoteCollection(collection: DbRemoteCollection) {
		remoteCache.value = new Map(remoteCache.value).set(collection.id, collection);
	}

	if (import.meta.client) {
		watch(
			() => toValue(remoteIds).join(","),
			async (ids, _previous, onCleanup) => {
				const missing = ids.split(",").filter((id) => id && !remoteCache.value.has(id));
				if (!missing.length) return;
				const controller = new AbortController();
				onCleanup(() => controller.abort());
				try {
					const { data } = await $fetch<{ data: DbRemoteCollection[] }>("/api/db/collections", {
						query: { ids: missing.join(",") },
						signal: controller.signal,
					});
					if (!controller.signal.aborted) {
						remoteCache.value = new Map([
							...remoteCache.value,
							...data.map((item) => [item.id, item] as const),
						]);
					}
				} catch {
					// The table can still display the requested collection IDs if metadata is unavailable.
				}
			},
			{ immediate: true },
		);
	}

	return {
		activeLocalCollections,
		activeLocalIds,
		addToCollection,
		createCollection,
		exportCollection,
		importCollection,
		localCollections,
		localRows,
		localSources,
		rememberRemoteCollection,
		remoteCollections,
		removeCollection,
		renameCollection,
		storageError,
	};
}
