<script setup lang="ts">
import type { DropdownMenuItem } from "@nuxt/ui";
import { computed, onScopeDispose, ref, watch } from "vue";

import { dbColumns, type WboeTableRow } from "#shared/utils/db-records";
import { dbMaxCollectionIds } from "#shared/utils/db-search";
import {
	dbRemoteCopyLimit,
	readDbCollection,
	readRemoteDbCollection,
	type DbLocalCollection,
	type DbRemoteCollection,
} from "~/composables/use-db-collections";
import { downloadDbRows, type DbExportFormat } from "~/utils/db-export";

const props = defineProps<{
	localCollections: DbLocalCollection[];
	remoteCollections: DbRemoteCollection[];
	selectedCount: number;
	storageError?: boolean;
}>();

const emit = defineEmits<{
	add: [id: string];
	copy: [name: string, rows: WboeTableRow[]];
	create: [name: string, includeSelection: boolean];
	export: [id: string];
	import: [collection: Awaited<ReturnType<typeof readDbCollection>>];
	rememberRemote: [collection: DbRemoteCollection];
	remove: [id: string];
	rename: [id: string, name: string];
}>();

const open = defineModel<boolean>("open", { required: true });
const activeLocalIds = defineModel<string[]>("activeLocalIds", { required: true });
const remoteIds = defineModel<string[]>("remoteIds", { required: true });

const { t } = useI18n<{ message: Record<string, string> }, "de" | "en">({
	useScope: "local",
	messages: {
		de: {
			addCollection: "Sammlung anlegen",
			addRemote: "{name} anzeigen",
			addSelected: "Auswahl hinzufügen",
			all: "Alle Belege anzeigen",
			allLocal: "Alle eigenen Sammlungen anzeigen",
			backup: "JSON-Sicherung herunterladen",
			cancel: "Abbrechen",
			copy: "{name} in meine Sammlungen kopieren",
			copyError: "Die Sammlung konnte nicht kopiert werden.",
			copyLimit: "Es können nur Sammlungen mit bis zu {count} Belegen kopiert werden.",
			createFromSelection: "Sammlung aus Auswahl",
			defaultName: "Sammlung {number}",
			empty: "Noch keine eigenen Sammlungen.",
			export: "Belege exportieren",
			exportError: "Die Belege konnten nicht exportiert werden.",
			filter: "Eigene Sammlungen filtern",
			import: "JSON-Sicherung importieren",
			importError: "Die Datei ist keine gültige WBÖ-Sammlungssicherung oder ist zu groß.",
			loadMore: "Weitere Sammlungen laden",
			local: "Meine Sammlungen",
			localDescription: "Eigene Sammlungen werden in diesem Browser gespeichert.",
			menu: "Aktionen für {name}",
			name: "Name der Sammlung",
			noResults: "Keine Sammlungen gefunden.",
			remote: "WBÖ-Sammlungen",
			remove: "Löschen",
			removeRemote: "{name} entfernen",
			rename: "Umbenennen",
			retry: "Erneut versuchen",
			rows: "Keine Belege | {count} Beleg | {count} Belege",
			save: "Speichern",
			search: "WBÖ-Sammlungen suchen",
			searchError: "Die WBÖ-Sammlungen konnten nicht geladen werden.",
			selectionLimit: "Es können bis zu {count} WBÖ-Sammlungen zugleich angezeigt werden.",
			storageError: "Änderungen konnten nicht dauerhaft im Browser gespeichert werden.",
			title: "Sammlungen",
		},
		en: {
			addCollection: "Create collection",
			addRemote: "Show {name}",
			addSelected: "Add selection",
			all: "Show all records",
			allLocal: "Show all my collections",
			backup: "Download JSON backup",
			cancel: "Cancel",
			copy: "Copy {name} to my collections",
			copyError: "The collection could not be copied.",
			copyLimit: "Only collections with up to {count} records can be copied.",
			createFromSelection: "Create from selection",
			defaultName: "Collection {number}",
			empty: "You have no collections yet.",
			export: "Export records",
			exportError: "The records could not be exported.",
			filter: "Filter my collections",
			import: "Import JSON backup",
			importError: "The file is too large or is not a valid WBÖ collection backup.",
			loadMore: "Load more collections",
			local: "My collections",
			localDescription: "Your collections are saved in this browser.",
			menu: "Actions for {name}",
			name: "Collection name",
			noResults: "No collections found.",
			remote: "WBÖ collections",
			remove: "Delete",
			removeRemote: "Remove {name}",
			rename: "Rename",
			retry: "Try again",
			rows: "No records | {count} record | {count} records",
			save: "Save",
			search: "Search WBÖ collections",
			searchError: "The WBÖ collections could not be loaded.",
			selectionLimit: "Up to {count} WBÖ collections can be shown at once.",
			storageError: "Changes could not be saved in this browser.",
			title: "Collections",
		},
	},
});

const editor = ref<{ name: string; id?: string; includeSelection: boolean }>();
const toast = useToast();
const filter = ref("");
const fileInput = useTemplateRef<HTMLInputElement>("file-input");
const importError = ref(false);

const visibleLocalCollections = computed(() => {
	const query = filter.value.trim().toLocaleLowerCase();
	return props.localCollections.filter(({ name }) => name.toLocaleLowerCase().includes(query));
});
const allLocalSelection = computed(() => {
	const selectedIds = new Set(activeLocalIds.value);
	const selected = props.localCollections.filter((collection) =>
		selectedIds.has(collection.id),
	).length;
	if (selected === 0) return false;
	return selected === props.localCollections.length ? true : "indeterminate";
});

function beginCreate(includeSelection: boolean) {
	const names = new Set(props.localCollections.map(({ name }) => name));
	let number = props.localCollections.length + 1;
	let name = t("defaultName", { number });
	while (names.has(name)) name = t("defaultName", { number: ++number });
	editor.value = { name, includeSelection };
}

function saveCollection() {
	const name = editor.value?.name.trim();
	if (!editor.value || !name) return;
	if (editor.value.id) emit("rename", editor.value.id, name);
	else emit("create", name, editor.value.includeSelection);
	editor.value = undefined;
}

function setLocalActive(id: string, active: boolean) {
	activeLocalIds.value = active
		? [...activeLocalIds.value, id]
		: activeLocalIds.value.filter((item) => item !== id);
}

function showAll() {
	activeLocalIds.value = [];
	remoteIds.value = [];
}

async function importBackup(event: Event) {
	const input = event.currentTarget as HTMLInputElement;
	const file = input.files?.[0];
	input.value = "";
	if (!file) return;
	importError.value = false;
	try {
		emit("import", await readDbCollection(file));
	} catch {
		importError.value = true;
	}
}

const exportFormats: { label: string; format: DbExportFormat }[] = [
	{ label: "Excel (.xlsx)", format: "xlsx" },
	{ label: "CSV", format: "csv" },
	{ label: "JSON", format: "json" },
];

async function exportRows(collection: DbLocalCollection, format: DbExportFormat) {
	try {
		await downloadDbRows(collection.rows, dbColumns, format, new Map());
	} catch {
		toast.add({ title: t("exportError"), color: "error" });
	}
}

function localActions(collection: DbLocalCollection): DropdownMenuItem[][] {
	const actions: DropdownMenuItem[] = [
		{
			label: t("rename"),
			icon: "i-lucide-pencil",
			onSelect: () => {
				editor.value = { id: collection.id, name: collection.name, includeSelection: false };
			},
		},
		{
			label: t("export"),
			icon: "i-lucide-table",
			disabled: !collection.rows.length,
			children: exportFormats.map(({ label, format }) => ({
				label,
				onSelect: () => void exportRows(collection, format),
			})),
		},
		{
			label: t("backup"),
			icon: "i-lucide-download",
			onSelect: () => emit("export", collection.id),
		},
	];
	if (props.selectedCount > 0) {
		actions.unshift({
			label: t("addSelected"),
			icon: "i-lucide-list-plus",
			onSelect: () => emit("add", collection.id),
		});
	}
	return [
		actions,
		[
			{
				label: t("remove"),
				icon: "i-lucide-trash-2",
				color: "error",
				onSelect: () => {
					if (editor.value?.id === collection.id) editor.value = undefined;
					emit("remove", collection.id);
				},
			},
		],
	];
}

const collectionQuery = ref("");
const remoteResult = ref<DbRemoteCollection[]>([]);
const remoteCount = ref(0);
const remotePage = ref(0);
const remoteStatus = ref<"idle" | "pending" | "success" | "error">("idle");
const remotePageSize = 25;
let searchController: AbortController | undefined;

const visibleRemoteResult = computed(() => {
	const ids = new Set(remoteIds.value);
	return remoteResult.value.filter(({ id }) => !ids.has(id));
});
const hasMore = computed(() => remotePage.value * remotePageSize < remoteCount.value);
const selectionLimitReached = computed(() => remoteIds.value.length >= dbMaxCollectionIds);

async function loadCollections(title: string, page: number) {
	searchController?.abort();
	const controller = new AbortController();
	searchController = controller;
	remoteStatus.value = "pending";
	try {
		const { data, count } = await $fetch<{ data: DbRemoteCollection[]; count: number }>(
			"/api/db/collections",
			{ query: { title, page }, signal: controller.signal },
		);
		if (controller.signal.aborted) return;
		const previous = page === 1 ? [] : remoteResult.value;
		remoteResult.value = Array.from(
			new Map([...previous, ...data].map((item) => [item.id, item])).values(),
		);
		remoteCount.value = count;
		remotePage.value = page;
		remoteStatus.value = "success";
	} catch {
		if (!controller.signal.aborted) remoteStatus.value = "error";
	}
}

watch(
	() => collectionQuery.value.trim(),
	(title, _previous, onCleanup) => {
		remoteResult.value = [];
		remotePage.value = 0;
		remoteCount.value = 0;
		remoteStatus.value = title ? "pending" : "idle";
		if (!title) return;
		const timer = setTimeout(() => void loadCollections(title, 1), 250);
		onCleanup(() => {
			clearTimeout(timer);
			searchController?.abort();
		});
	},
);

function addRemoteCollection(collection: DbRemoteCollection) {
	if (selectionLimitReached.value) return;
	emit("rememberRemote", collection);
	remoteIds.value = [...remoteIds.value, collection.id];
}

function removeRemoteCollection(id: string) {
	remoteIds.value = remoteIds.value.filter((item) => item !== id);
}

const copyingId = ref<string>();
const copyError = ref<"copyError" | "copyLimit">();
let copyController: AbortController | undefined;
onScopeDispose(() => copyController?.abort());

async function copyRemoteCollection(collection: DbRemoteCollection) {
	if (copyingId.value) return;
	const controller = new AbortController();
	copyController = controller;
	copyingId.value = collection.id;
	copyError.value = undefined;
	try {
		const rows = await readRemoteDbCollection(collection.id, controller.signal);
		if (controller.signal.aborted) return;
		if (rows) emit("copy", collection.name.trim().slice(0, 120) || `#${collection.id}`, rows);
		else copyError.value = "copyLimit";
	} catch {
		if (!controller.signal.aborted) copyError.value = "copyError";
	} finally {
		copyingId.value = undefined;
		copyController = undefined;
	}
}
</script>

<template>
	<USlideover
		v-model:open="open"
		side="left"
		:title="t('title')"
		:description="t('localDescription')"
	>
		<template #body>
			<div class="space-y-6">
				<UButton
					block
					:disabled="!activeLocalIds.length && !remoteIds.length"
					icon="i-lucide-database"
					:label="t('all')"
					variant="soft"
					@click="showAll"
				/>

				<section class="space-y-3">
					<h3 class="text-sm font-semibold text-highlighted">{{ t("local") }}</h3>
					<div class="flex flex-wrap gap-2">
						<UButton
							icon="i-lucide-plus"
							:label="t('addCollection')"
							size="sm"
							@click="beginCreate(false)"
						/>
						<UButton
							v-if="selectedCount > 0"
							icon="i-lucide-list-plus"
							:label="t('createFromSelection')"
							size="sm"
							variant="soft"
							@click="beginCreate(true)"
						/>
					</div>
					<form
						v-if="editor"
						class="space-y-2 rounded-md border border-default bg-elevated/50 p-3"
						@submit.prevent="saveCollection"
					>
						<UFormField :label="t('name')" required>
							<UInput v-model="editor.name" autofocus class="w-full" maxlength="120" />
						</UFormField>
						<div class="flex justify-end gap-2">
							<UButton
								type="button"
								color="neutral"
								:label="t('cancel')"
								size="sm"
								variant="ghost"
								@click="editor = undefined"
							/>
							<UButton type="submit" :disabled="!editor.name.trim()" :label="t('save')" size="sm" />
						</div>
					</form>
					<UAlert
						v-if="storageError"
						color="warning"
						:description="t('storageError')"
						variant="soft"
					/>
					<UCheckbox
						v-if="localCollections.length > 1"
						:label="t('allLocal')"
						:model-value="allLocalSelection"
						@update:model-value="
							activeLocalIds = $event === true ? localCollections.map(({ id }) => id) : []
						"
					/>
					<UInput
						v-if="localCollections.length > 4"
						v-model="filter"
						:aria-label="t('filter')"
						class="w-full"
						icon="i-lucide-search"
						:placeholder="t('filter')"
					/>
					<p v-if="!localCollections.length" class="text-sm text-muted">{{ t("empty") }}</p>
					<p v-else-if="!visibleLocalCollections.length" class="text-sm text-muted">
						{{ t("noResults") }}
					</p>
					<ul v-else class="divide-y divide-default rounded-md border border-default">
						<li
							v-for="collection in visibleLocalCollections"
							:key="collection.id"
							class="flex items-center justify-between gap-2 p-2"
						>
							<UCheckbox
								class="min-w-0 wrap-anywhere"
								:description="t('rows', collection.rows.length)"
								:label="collection.name"
								:model-value="activeLocalIds.includes(collection.id)"
								@update:model-value="setLocalActive(collection.id, $event === true)"
							/>
							<UDropdownMenu :items="localActions(collection)">
								<UButton
									:aria-label="t('menu', { name: collection.name })"
									color="neutral"
									icon="i-lucide-ellipsis"
									size="sm"
									variant="ghost"
								/>
							</UDropdownMenu>
						</li>
					</ul>
					<UButton
						color="neutral"
						icon="i-lucide-upload"
						:label="t('import')"
						size="sm"
						variant="ghost"
						@click="fileInput?.click()"
					/>
					<input
						ref="file-input"
						accept=".json,application/json"
						hidden
						type="file"
						@change="importBackup"
					/>
					<UAlert v-if="importError" color="error" :description="t('importError')" variant="soft" />
				</section>

				<USeparator />

				<section class="space-y-3">
					<h3 class="text-sm font-semibold text-highlighted">{{ t("remote") }}</h3>
					<ul
						v-if="remoteCollections.length"
						class="divide-y divide-default rounded-md border border-default"
					>
						<li
							v-for="collection in remoteCollections"
							:key="collection.id"
							class="flex items-start justify-between gap-2 p-2"
						>
							<div class="min-w-0 text-sm wrap-anywhere">
								<p class="font-medium text-highlighted">{{ collection.name }}</p>
								<p v-if="collection.description" class="mt-1 text-muted">
									{{ collection.description }}
								</p>
							</div>
							<div class="flex gap-1">
								<UTooltip :text="t('copy', { name: collection.name })">
									<UButton
										:aria-label="t('copy', { name: collection.name })"
										color="neutral"
										:disabled="!!copyingId"
										icon="i-lucide-copy"
										:loading="copyingId === collection.id"
										size="sm"
										variant="ghost"
										@click="copyRemoteCollection(collection)"
									/>
								</UTooltip>
								<UButton
									:aria-label="t('removeRemote', { name: collection.name })"
									color="neutral"
									icon="i-lucide-x"
									size="sm"
									variant="ghost"
									@click="removeRemoteCollection(collection.id)"
								/>
							</div>
						</li>
					</ul>
					<UAlert
						v-if="copyError"
						color="error"
						:description="t(copyError, { count: dbRemoteCopyLimit })"
						variant="soft"
					/>
					<p v-if="selectionLimitReached" class="text-sm text-muted">
						{{ t("selectionLimit", { count: dbMaxCollectionIds }) }}
					</p>
					<UInput
						v-model="collectionQuery"
						:aria-label="t('search')"
						class="w-full"
						icon="i-lucide-search"
						:loading="remoteStatus === 'pending'"
						:placeholder="t('search')"
						type="search"
					/>
					<UAlert
						v-if="remoteStatus === 'error'"
						color="error"
						:description="t('searchError')"
						variant="soft"
					/>
					<p
						v-else-if="remoteStatus === 'success' && !remoteResult.length"
						aria-live="polite"
						class="text-sm text-muted"
					>
						{{ t("noResults") }}
					</p>
					<ul
						v-if="visibleRemoteResult.length"
						class="divide-y divide-default rounded-md border border-default"
					>
						<li
							v-for="collection in visibleRemoteResult"
							:key="collection.id"
							class="flex items-start justify-between gap-2 p-2"
						>
							<div class="min-w-0 text-sm wrap-anywhere">
								<p class="font-medium text-highlighted">{{ collection.name }}</p>
								<p v-if="collection.description" class="mt-1 text-muted">
									{{ collection.description }}
								</p>
							</div>
							<UButton
								:aria-label="t('addRemote', { name: collection.name })"
								:disabled="selectionLimitReached"
								icon="i-lucide-plus"
								size="sm"
								variant="soft"
								@click="addRemoteCollection(collection)"
							/>
						</li>
					</ul>
					<UButton
						v-if="hasMore || remoteStatus === 'error'"
						color="neutral"
						:label="t(remoteStatus === 'error' ? 'retry' : 'loadMore')"
						:loading="remoteStatus === 'pending'"
						size="sm"
						variant="soft"
						@click="loadCollections(collectionQuery.trim(), remotePage + 1)"
					/>
				</section>
			</div>
		</template>
	</USlideover>
</template>
