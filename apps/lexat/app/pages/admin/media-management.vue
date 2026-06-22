<script lang="ts" setup>
import { CheckCircle2, CloudUpload, FileImage, Trash2, X } from "@lucide/vue";
import { useDropZone, useFileDialog } from "@vueuse/core";
import type { InferResponseType } from "hono/client";
import { computed, ref } from "vue";
import { toast } from "vue-sonner";

definePageMeta({
	layout: "cms",
	middleware: ["protected"],
});

const { apiClient } = useApiClient();

type UploadStatus = "pending" | "success" | "error";

interface AssetItem {
	id: string;
	file: File;
	category: string | null;
	status: UploadStatus;
	previewUrl: string;
}

const config = useRuntimeConfig();
const { questions } = await useQuestions();

const mappedQuestions = computed(() => {
	return (
		questions.value?.map((q) => ({
			id: q.id,
			value: q.id.toString(),
			label: q.phenomenon_name,
		})) ?? []
	);
});

const assets = ref<Array<AssetItem>>([]);

// --- File Handling ---
const { open: openFileDialog, onChange } = useFileDialog({
	accept: "image/png, image/jpeg, image/webp, image/gif",
	multiple: true,
});

onChange((files) => {
	if (files) addFiles(Array.from(files));
});

const dropZoneRef = ref<HTMLElement>();
const { isOverDropZone } = useDropZone(dropZoneRef, {
	onDrop: (files) => {
		if (files) addFiles(files.filter((f) => f.type.startsWith("image/")));
	},
});

// limit uploads tp 5MB in bytes
const MAX_FILE_SIZE = 5 * 1024 * 1024;

const addFiles = (files: Array<File>) => {
	files.forEach((file) => {
		if (file.size > MAX_FILE_SIZE) {
			toast.error(`"${file.name}" is too large. Maximum size is 5MB.`);
			return;
		}

		assets.value.push({
			id: crypto.randomUUID(),
			file,
			category: "",
			status: "pending",
			previewUrl: URL.createObjectURL(file),
		});
	});
};

const removeAsset = (id: string) => {
	const index = assets.value.findIndex((a) => a.id === id);
	if (index > -1) {
		URL.revokeObjectURL(assets.value[index].previewUrl);
		assets.value.splice(index, 1);
	}
};

const discardAll = () => {
	assets.value.forEach((a) => URL.revokeObjectURL(a.previewUrl));
	assets.value = [];
};

const _getAllPhenomenaWithStimuli = apiClient.questions.phen.all.$get;
export type APIPhenomenaWithStimuli = InferResponseType<typeof _getAllPhenomenaWithStimuli, 200>;
type APIPhenomenonWithStimulus = APIPhenomenaWithStimuli[number];

const { data: allPhenomenaWithStimuli, refresh: refreshPhenomena } =
	await useFetch<APIPhenomenaWithStimuli>("questions/phen/all", {
		baseURL: config.public.apiBaseUrl,
		credentials: "include",
		method: "get",
	});

// --- Upload Logic ---
const isProcessing = ref(false);

const processAssets = async () => {
	isProcessing.value = true;
	const pendingAssets = assets.value.filter((a) => a.status === "pending");
	let successCount = 0;

	for (const asset of pendingAssets) {
		if (!asset.category) continue;

		try {
			const formData = new FormData();
			formData.append("image", asset.file);

			await $fetch<{ imageUrl: string; message: string }>(`media/phen/${asset.category}`, {
				baseURL: config.public.apiBaseUrl,
				credentials: "include",
				method: "POST",
				body: formData,
			});

			asset.status = "success";
			successCount++;
		} catch (error) {
			console.error(`Error uploading file ${asset.file.name}:`, error);
			asset.status = "error";
			toast.error(`Failed to upload ${asset.file.name}`);
		}
	}

	isProcessing.value = false;

	if (successCount > 0) {
		toast.success(`${successCount} images successfully uploaded`);
		await refreshPhenomena();
	}
};

// --- Delete Logic (Updated for Dialog) ---
const isDeleteDialogOpen = ref(false);
const isDeleting = ref(false);
const itemToDelete = ref<{ id: number; name: string } | null>(null);

const openDeleteDialog = (phen: APIPhenomenonWithStimulus) => {
	itemToDelete.value = { id: phen.id, name: phen.phenomenon_name ?? "" };
	isDeleteDialogOpen.value = true;
};

const confirmDelete = async () => {
	if (!itemToDelete.value) return;

	isDeleting.value = true;

	try {
		await $fetch(`media/phen/${itemToDelete.value.id}`, {
			baseURL: config.public.apiBaseUrl,
			credentials: "include",
			method: "DELETE",
		});

		toast.success("Image deleted successfully");
		await refreshPhenomena();
		isDeleteDialogOpen.value = false;
	} catch (error) {
		console.error("Error deleting image:", error);
		toast.error("Failed to delete the image");
	} finally {
		isDeleting.value = false;
		// We intentionally don't clear itemToDelete immediately so the dialog
		// doesn't flash empty text while animating closed.
	}
};

// --- Computed Stats ---
const isReadyToUpload = computed(() => {
	const pendingItems = assets.value.filter((a) => a.status === "pending");
	if (pendingItems.length === 0) return false;
	return pendingItems.every((item) => Boolean(item.category.trim()));
});
const totalSize = computed(() => {
	const bytes = assets.value.reduce((acc, a) => acc + a.file.size, 0);
	return (bytes / (1024 * 1024)).toFixed(1);
});
const pendingCount = computed(() => assets.value.filter((a) => a.status === "pending").length);
const successCount = computed(() => assets.value.filter((a) => a.status === "success").length);
const totalCount = computed(() => assets.value.length);
const canProcess = computed(
	() => pendingCount.value > 0 && !isProcessing.value && isReadyToUpload.value,
);
</script>

<template>
	<main class="w-full max-w-[1600px] mx-auto p-6" :tabindex="-1">
		<div class="flex items-center justify-between mb-8">
			<h1 class="text-2xl font-semibold text-slate-800">Impulsbilder Verwaltung</h1>
			<div
				class="px-4 py-1.5 rounded-full border text-sm font-medium flex items-center gap-2"
				:class="
					pendingCount > 0
						? 'bg-orange-50 border-orange-200 text-orange-700'
						: 'bg-slate-50 border-slate-200 text-slate-600'
				"
			>
				<div
					class="w-2 h-2 rounded-full"
					:class="pendingCount > 0 ? 'bg-orange-500' : 'bg-slate-400'"
				></div>
				Queue: {{ pendingCount }} Items Pending
			</div>
		</div>

		<div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
			<div class="lg:col-span-4 flex flex-col gap-6">
				<div
					ref="dropZoneRef"
					class="bg-white rounded-2xl border-2 border-dashed transition-colors flex flex-col items-center justify-center p-12 text-center min-h-[400px]"
					:class="isOverDropZone ? 'border-indigo-500 bg-indigo-50/50' : 'border-slate-200'"
				>
					<div
						class="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-6 text-slate-400"
					>
						<CloudUpload class="w-8 h-8" />
					</div>
					<h3 class="text-lg font-medium text-slate-700 mb-2">Drop your images here</h3>
					<p class="text-slate-500 text-sm mb-8">Supports PNG, JPG, WEBP, GIF</p>

					<Button
						class="bg-[#0f172a] hover:bg-slate-800 text-white px-8"
						variant="default"
						@click="openFileDialog"
					>
						Browse Files
					</Button>
				</div>

				<!-- Status Card -->
				<div class="bg-[#0f172a] rounded-2xl p-6 text-white shadow-lg">
					<div class="flex items-center justify-between mb-4">
						<h4 class="text-xs font-semibold tracking-wider text-slate-400 uppercase">
							Verarbeitungsstatus
						</h4>
						<div
							class="px-3 py-1 rounded text-xs font-medium"
							:class="
								totalCount > 0 ? 'bg-indigo-500/20 text-indigo-300' : 'bg-slate-700 text-slate-300'
							"
						>
							{{ totalCount > 0 ? "Aktiv" : "Leer" }}
						</div>
					</div>
					<p class="text-sm text-slate-300">
						<template v-if="totalCount === 0">
							Lade Bilder hoch und weise ihnen Kategorien zu, um sie zu verarbeiten.
						</template>
						<template v-else>
							{{ successCount }} von {{ totalCount }} Bildern gespeichert.
						</template>
					</p>
				</div>
			</div>
			<div
				class="lg:col-span-8 bg-white border border-slate-200 rounded-2xl flex flex-col shadow-sm overflow-hidden min-h-[600px]"
			>
				<div
					class="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50"
				>
					<h2 class="text-sm font-bold text-slate-700 tracking-wide uppercase">
						Pending Assignments
					</h2>
					<span class="text-sm text-slate-400">Total File Size: {{ totalSize }} MB</span>
				</div>

				<div
					class="grid grid-cols-12 gap-4 px-6 py-4 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wider"
				>
					<div class="col-span-5">Preview & Filename</div>
					<div class="col-span-5">Category Assignment</div>
					<div class="col-span-2 text-right">Status</div>
				</div>
				<div class="flex-1 overflow-y-auto p-2">
					<div
						v-if="assets.length === 0"
						class="h-full flex flex-col items-center justify-center text-slate-400 space-y-4 py-20"
					>
						<FileImage class="w-12 h-12 opacity-20" />
						<p class="text-sm">Noch keine Bilder hinzugefügt.</p>
					</div>

					<div
						v-for="asset in assets"
						:key="asset.id"
						class="grid grid-cols-12 gap-4 items-center px-4 py-3 hover:bg-slate-50 rounded-lg transition-colors group"
					>
						<div class="col-span-5 flex items-center gap-4">
							<div
								class="w-12 h-12 rounded border border-slate-200 overflow-hidden bg-slate-100 shrink-0"
							>
								<img :alt="asset.category ?? ''" class="object-cover" :src="asset.previewUrl" />
							</div>
						</div>

						<div class="col-span-5">
							<ComboboxBase
								v-model="asset.category"
								data-testid="questions"
								:disabled="asset.status === 'success'"
								has-search
								:options="mappedQuestions"
								placeholder="Phänomen"
							/>
						</div>

						<div class="col-span-2 flex items-center justify-end">
							<template v-if="asset.status === 'success'">
								<div
									class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-50 text-green-700 text-xs font-medium border border-green-200"
								>
									<CheckCircle2 class="w-3.5 h-3.5" />
									Gespeichert
								</div>
							</template>
							<template v-else>
								<button
									class="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
									@click="removeAsset(asset.id)"
								>
									<X class="w-4 h-4" />
								</button>
							</template>
						</div>
					</div>

					<div
						class="mt-auto px-6 py-5 border-t border-slate-100 flex items-center justify-between bg-slate-50/50"
					>
						<div class="flex flex-col">
							<span class="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1"
								>Upload Queue</span
							>
							<span class="text-sm text-slate-600">
								<template v-if="pendingCount === 0">No items</template>
								<template v-else>{{ pendingCount }} items ready</template>
							</span>
						</div>

						<div class="flex items-center gap-6">
							<button
								class="text-sm font-medium text-slate-500 hover:text-slate-800 transition-colors"
								:disabled="isProcessing"
								@click="discardAll"
							>
								Discard All
							</button>
							<Button
								class="bg-indigo-500 hover:bg-indigo-600 text-white disabled:bg-indigo-300 disabled:opacity-70 px-6 py-2"
								:disabled="!canProcess"
								@click="processAssets"
							>
								{{ isProcessing ? "Processing..." : "Process Assets" }}
							</Button>
						</div>
					</div>
				</div>
			</div>
		</div>

		<div
			class="mt-12 bg-white border border-slate-200 rounded-2xl flex flex-col shadow-sm overflow-hidden"
		>
			<div
				class="px-6 py-5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between"
			>
				<h2 class="text-sm font-bold text-slate-700 tracking-wide uppercase">
					Aktive Impulsbilder
				</h2>
				<span class="text-sm text-slate-500 font-medium">
					Total: {{ allPhenomenaWithStimuli?.length || 0 }}
				</span>
			</div>

			<div
				class="grid grid-cols-12 gap-4 px-6 py-4 border-b border-slate-100 text-xs font-semibold text-slate-500 uppercase tracking-wider bg-white"
			>
				<div class="col-span-3">Vorschau</div>
				<div class="col-span-7">Phänomen</div>
				<div class="col-span-2 text-right">Aktion</div>
			</div>

			<div class="flex-1 overflow-y-auto">
				<div
					v-if="!allPhenomenaWithStimuli?.length"
					class="flex flex-col items-center justify-center text-slate-400 space-y-4 py-16"
				>
					<FileImage class="w-12 h-12 opacity-20" />
					<p class="text-sm">Bisher wurden keine Impulsbilder zugewiesen.</p>
				</div>

				<div
					v-for="phen in allPhenomenaWithStimuli"
					v-else
					:key="phen.id"
					class="grid grid-cols-12 gap-4 items-center px-6 py-3 border-b border-slate-50 hover:bg-slate-50 transition-colors group last:border-0"
				>
					<div class="col-span-3">
						<div
							class="w-16 h-16 rounded-md border border-slate-200 overflow-hidden bg-slate-100 shrink-0 shadow-sm"
						>
							<img
								v-if="phen.stimulus_media"
								:alt="phen.phenomenon_name ?? ''"
								class="w-full h-full object-cover"
								:src="phen.stimulus_media"
							/>
						</div>
					</div>

					<div class="col-span-7 font-medium text-slate-700">
						{{ phen.phenomenon_name }}
					</div>

					<div class="col-span-2 flex items-center justify-end">
						<button
							class="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-all disabled:opacity-50"
							title="Löschen"
							@click="openDeleteDialog(phen)"
						>
							<Trash2 class="w-4 h-4" />
						</button>
					</div>
				</div>
			</div>
		</div>

		<Dialog :open="isDeleteDialogOpen" @update:open="(newVal) => (isDeleteDialogOpen = newVal)">
			<DialogContent class="sm:max-w-[425px]">
				<DialogHeader>
					<DialogTitle>Delete Image</DialogTitle>
					<DialogDescription class="mt-2">
						Are you sure you want to delete the image assigned to
						<strong class="text-slate-800">{{ itemToDelete?.name }}</strong
						>? This action cannot be undone.
					</DialogDescription>
				</DialogHeader>

				<DialogFooter class="mt-6 flex items-center gap-2">
					<DialogClose as-child>
						<Button :disabled="isDeleting" type="button" variant="secondary"> Cancel </Button>
					</DialogClose>
					<Button :disabled="isDeleting" type="button" @click="confirmDelete">
						{{ isDeleting ? "Deleting..." : "Delete Image" }}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	</main>
</template>
