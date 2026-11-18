<script setup lang="ts">
import { computed, ref, useId, useTemplateRef, watch } from "vue";

const props = defineProps<{ facs: string; lemma: string }>();
const open = defineModel<boolean>("open", { required: true });
const { t } = useI18n();
const config = useRuntimeConfig();
const pickerLabelId = useId();

const imageService = computed(() => config.public.dbImageBaseUrl.replace(/\/+$/u, ""));
const identifiers = computed(() => [
	...new Set(
		props.facs
			.trim()
			.split(/\s+/u)
			.flatMap((token) => {
				try {
					const segments = decodeURIComponent(token).replace(/^\/+/u, "").split("/");
					if (segments.some((segment) => !segment || segment === "." || segment === ".."))
						return [];
					return segments.map(encodeURIComponent).join("/");
				} catch {
					return [];
				}
			}),
	),
]);

const selected = ref(0);
const image = useTemplateRef<HTMLImageElement>("scan-image");
const imageStatus = ref<"loading" | "loaded" | "error">("loading");
const selectedIdentifier = computed(() => identifiers.value[selected.value]);
const preview = computed(() =>
	selectedIdentifier.value && imageService.value
		? `${imageService.value}/${selectedIdentifier.value}/full/!1200,900/0/default.jpg`
		: undefined,
);
const original = computed(() =>
	selectedIdentifier.value && imageService.value
		? `${imageService.value}/${selectedIdentifier.value}/full/!2500,1500/0/default.jpg`
		: undefined,
);

watch([() => props.facs, open], () => {
	if (open.value) selected.value = 0;
});
watch(image, (element) => {
	if (!element?.complete) imageStatus.value = "loading";
	else imageStatus.value = element.naturalWidth > 0 ? "loaded" : "error";
});
</script>

<template>
	<UModal
		v-model:open="open"
		:title="t('DbPage.openScan', { lemma })"
		:ui="{ content: 'sm:max-w-4xl' }"
	>
		<template #body>
			<div class="space-y-4">
				<div v-if="identifiers.length > 1" class="flex flex-wrap items-center gap-x-3 gap-y-2">
					<span :id="pickerLabelId" class="text-sm font-medium text-default">
						{{ t("DbPage.scans") }}
					</span>
					<div
						class="inline-flex flex-wrap gap-1 rounded-lg border border-default bg-elevated/50 p-1"
						role="group"
						:aria-labelledby="pickerLabelId"
					>
						<UButton
							v-for="(identifier, index) in identifiers"
							:key="identifier"
							:aria-label="t('DbPage.scanNumber', { number: index + 1 })"
							:aria-pressed="selected === index"
							class="min-h-11 min-w-11 justify-center px-2 font-semibold tabular-nums sm:min-h-9 sm:min-w-9"
							color="neutral"
							:label="String(index + 1)"
							:variant="selected === index ? 'solid' : 'ghost'"
							@click="selected = index"
						/>
					</div>
				</div>
				<div
					class="relative grid h-[min(65svh,48rem)] place-items-center overflow-hidden rounded-md bg-elevated/50"
				>
					<img
						v-if="preview"
						:key="preview"
						ref="scan-image"
						:alt="t('DbPage.scanAlt', { lemma })"
						class="absolute inset-0 size-full object-contain"
						:class="{ invisible: imageStatus !== 'loaded' }"
						decoding="async"
						:src="preview"
						@error="imageStatus = 'error'"
						@load="imageStatus = 'loaded'"
					/>
					<UAlert
						v-if="!preview || imageStatus === 'error'"
						class="w-auto max-w-full"
						color="warning"
						icon="i-lucide-image-off"
						:title="t('DbPage.scanError')"
					/>
					<div v-else-if="imageStatus === 'loading'" role="status">
						<UIcon
							aria-hidden="true"
							class="size-6 animate-spin text-muted motion-reduce:animate-none"
							name="i-lucide-loader-circle"
						/>
						<span class="sr-only">{{ t("DbPage.scanLoading") }}</span>
					</div>
				</div>
			</div>
		</template>
		<template v-if="original" #footer>
			<UButton
				color="neutral"
				:label="t('DbPage.openScanExternally')"
				trailing-icon="i-lucide-external-link"
				:to="original"
				target="_blank"
				variant="outline"
			/>
		</template>
	</UModal>
</template>
