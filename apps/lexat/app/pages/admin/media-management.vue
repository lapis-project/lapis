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
const t = useTranslations();

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
			<h1 class="text-2xl font-semibold">{{ t("AdminPage.media.title") }}</h1>
			<div
				class="px-4 py-1.5 rounded-full border text-sm font-medium flex items-center gap-2"
				:class="
					pendingCount > 0
						? 'bg-orange-50 border-orange-200 text-orange-700 dark:bg-orange-100 dark:border-orange-300 dark:text-orange-800'
						: 'bg-gray-50 border-gray-200 dark:border-gray-500 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
				"
			>
				<div
					class="w-2 h-2 rounded-full"
					:class="pendingCount > 0 ? 'bg-orange-500' : 'bg-gray-400'"
				></div>
				{{ t("AdminPage.media.queue") }}: {{ pendingCount }} {{ t("AdminPage.media.pending") }}
			</div>
		</div>

		<div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
			<div class="lg:col-span-4 flex flex-col gap-6">
				<div
					ref="dropZoneRef"
					class="bg-white dark:bg-gray-800 rounded-2xl border-2 border-dashed transition-colors flex flex-col items-center justify-center p-12 text-center min-h-[400px]"
					:class="
						isOverDropZone
							? 'border-indigo-500 bg-indigo-50/50 dark:border-indigo-200 dark:bg-indigo-20/50'
							: 'border-gray-200 dark:border-gray-700 '
					"
				>
					<div
						class="w-16 h-16 bg-gray-100 dark:bg-gray-600 rounded-full flex items-center justify-center mb-6 text-gray-400"
					>
						<CloudUpload class="w-8 h-8" />
					</div>
					<h3 class="text-lg font-medium text-foreground mb-2">
						{{ t("AdminPage.media.drop_off.description") }}
					</h3>
					<p class="text-gray-500 dark:text-gray-400 text-sm mb-8">
						{{ t("AdminPage.media.drop_off.image_types") }}
					</p>

					<Button @click="openFileDialog"> {{ t("AdminPage.media.drop_off.browse_btn") }} </Button>
				</div>

				<!-- Status Card -->
				<div class="dark:bg-white bg-[#171717] rounded-2xl p-6 text-primary-foreground shadow-lg">
					<div class="flex items-center justify-between mb-4">
						<h4
							class="text-xs font-semibold tracking-wider dark:text-gray-800 text-gray-100 uppercase"
						>
							{{ t("AdminPage.media.status_card.title") }}
						</h4>
						<div
							class="px-3 py-1 rounded text-xs font-medium"
							:class="
								totalCount > 0
									? 'bg-indigo-500/20  text-indigo-300 dark:text-indigo-600'
									: 'dark:bg-gray-300 dark:text-gray-600 bg-gray-600 text-gray-300'
							"
						>
							{{
								totalCount > 0
									? t("AdminPage.media.status_card.state.active")
									: t("AdminPage.media.status_card.state.empty")
							}}
						</div>
					</div>
					<p class="text-sm text-gray-400 dark:text-gray-400">
						<template v-if="totalCount === 0">
							{{ t("AdminPage.media.status_card.description") }}
						</template>
						<template v-else>
							{{ successCount }} {{ t("AdminPage.media.status_card.of") }} {{ totalCount }}
							{{ t("AdminPage.media.status_card.saved") }}.
						</template>
					</p>
				</div>
			</div>
			<div
				class="lg:col-span-8 border border-gray-200 dark:border-gray-700 rounded-2xl flex flex-col shadow-sm overflow-hidden min-h-[600px]"
			>
				<div
					class="px-6 py-5 bg-gray-50 dark:bg-gray-700 border-b border-gray-100 dark:border-gray-600 flex items-center justify-between"
				>
					<h2 class="text-sm font-bold text-foreground tracking-wide uppercase">
						{{ t("AdminPage.media.assignments.title") }}
					</h2>
					<span class="text-sm text-gray-400"
						>{{ t("AdminPage.media.assignments.size") }}: {{ totalSize }} MB</span
					>
				</div>

				<div
					class="grid grid-cols-12 gap-4 px-6 py-4 bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-600 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider"
				>
					<div class="col-span-5">{{ t("AdminPage.media.assignments.columns.preview") }}</div>
					<div class="col-span-5">{{ t("AdminPage.media.assignments.columns.category") }}</div>
					<div class="col-span-2 text-right">
						{{ t("AdminPage.media.assignments.columns.status") }}
					</div>
				</div>
				<div class="flex-1 overflow-y-auto p-2 bg-white dark:bg-gray-800">
					<div
						v-if="assets.length === 0"
						class="h-full flex flex-col items-center justify-center text-gray-400 space-y-4 py-20"
					>
						<FileImage class="w-12 h-12 opacity-20" />
						<p class="text-sm">{{ t("AdminPage.media.assignments.body.placeholder") }}.</p>
					</div>

					<div
						v-for="asset in assets"
						:key="asset.id"
						class="grid grid-cols-12 gap-4 items-center px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors group"
					>
						<div class="col-span-5 flex items-center gap-4">
							<div
								class="w-12 h-12 rounded border border-gray-200 dark:border-gray-700 overflow-hidden bg-gray-100 shrink-0"
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
									class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-50 text-green-700 dark:bg-green-100 dark:text-green-900 text-xs font-medium border border-green-200"
								>
									<CheckCircle2 class="w-3.5 h-3.5" />
									{{ t("AdminPage.media.assignments.body.saved_msg") }}
								</div>
							</template>
							<template v-else>
								<button
									class="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:text-red-600 dark:hover:bg-red-100 rounded-md transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
									@click="removeAsset(asset.id)"
								>
									<X class="w-4 h-4" />
								</button>
							</template>
						</div>
					</div>

					<div
						class="mt-auto px-6 py-5 border-t border-gray-100 flex items-center justify-between bg-gray-50 dark:bg-gray-700"
					>
						<div class="flex flex-col">
							<span class="text-xs font-semibold text-foreground uppercase tracking-wider mb-1">{{
								t("AdminPage.media.assignments.footer.upload_queue")
							}}</span>
							<span class="text-sm text-gray-500 dark:text-gray-400">
								<template v-if="pendingCount === 0">{{
									t("AdminPage.media.assignments.footer.pending.none")
								}}</template>
								<template v-else
									>{{ pendingCount }}
									{{ t("AdminPage.media.assignments.footer.pending.count") }}</template
								>
							</span>
						</div>

						<div class="flex items-center gap-6">
							<button
								class="text-sm font-medium text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-300 transition-colors"
								:disabled="isProcessing"
								@click="discardAll"
							>
								{{ t("AdminPage.media.assignments.footer.discard") }}
							</button>
							<Button
								class="bg-indigo-500 hover:bg-indigo-600 text-white disabled:bg-indigo-300 disabled:opacity-70 px-6 py-2"
								:disabled="!canProcess"
								@click="processAssets"
							>
								{{
									isProcessing
										? t("AdminPage.media.assignments.footer.processing")
										: t("AdminPage.media.assignments.footer.process_btn")
								}}
							</Button>
						</div>
					</div>
				</div>
			</div>
		</div>

		<div
			class="mt-12 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl flex flex-col shadow-sm overflow-hidden"
		>
			<div
				class="px-6 py-5 border-b border-gray-100 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 flex items-center justify-between"
			>
				<h2 class="text-sm font-bold text-foreground tracking-wide uppercase">
					{{ t("AdminPage.media.active_images.title") }}
				</h2>
				<span class="text-sm text-gray-400 font-medium">
					{{ t("AdminPage.media.active_images.total") }}: {{ allPhenomenaWithStimuli?.length || 0 }}
				</span>
			</div>

			<div
				class="grid grid-cols-12 gap-4 px-6 py-4 border-b border-gray-100 dark:border-gray-600 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider bg-white dark:bg-gray-800"
			>
				<div class="col-span-3">{{ t("AdminPage.media.active_images.columns.preview") }}</div>
				<div class="col-span-7">{{ t("AdminPage.media.active_images.columns.category") }}</div>
				<div class="col-span-2 text-right">
					{{ t("AdminPage.media.active_images.columns.action") }}
				</div>
			</div>

			<div class="flex-1 overflow-y-auto">
				<div
					v-if="!allPhenomenaWithStimuli?.length"
					class="flex flex-col items-center justify-center text-gray-400 space-y-4 py-16"
				>
					<FileImage class="w-12 h-12 opacity-20" />
					<p class="text-sm">{{ t("AdminPage.media.active_images.body.placeholder") }}</p>
				</div>

				<div
					v-for="phen in allPhenomenaWithStimuli"
					v-else
					:key="phen.id"
					class="grid grid-cols-12 gap-4 items-center px-6 py-3 border-b border-gray-50 dark:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors group last:border-0"
				>
					<div class="col-span-3">
						<div
							class="w-16 h-16 rounded-md border border-gray-200 dark:border-gray-700 overflow-hidden bg-gray-100 shrink-0 shadow-sm"
						>
							<img
								v-if="phen.stimulus_media"
								:alt="phen.phenomenon_name ?? ''"
								class="w-full h-full object-cover"
								:src="phen.stimulus_media"
							/>
						</div>
					</div>

					<div class="col-span-7 font-medium text-gray-700 dark:text-gray-300">
						{{ phen.phenomenon_name }}
					</div>

					<div class="col-span-2 flex items-center justify-end">
						<button
							class="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:text-red-600 dark:hover:bg-red-100 rounded-md transition-all disabled:opacity-50"
							:title="t('AdminPage.media.active_images.body.delete')"
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
					<DialogTitle>{{ t("AdminPage.media.delete_dialog.title") }}</DialogTitle>
					<DialogDescription class="mt-2">
						{{ t("AdminPage.media.delete_dialog.description") }}
						<strong class="text-gray-800 dark:text-gray-200">{{ itemToDelete?.name }}</strong>
						{{ t("AdminPage.media.delete_dialog.warning") }}
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
