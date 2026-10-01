<script lang="ts" setup>
import { ExternalLinkIcon } from "@lucide/vue";

import { parseMapQuery } from "@/utils/map-query";
import { PILOT_DATASET_ID } from "@/utils/pilot-data";

definePageMeta({ layout: false });

const EMBED_MAP_ID = "embed";

const t = useTranslations();
const route = useRoute();
const localePath = useLocalePath();
const colorStore = useColorStore();

const { palette, maps } = parseMapQuery(route.query);
const state = maps.left;

const available = state === undefined || state.dataset === PILOT_DATASET_ID;

if (palette) colorStore.setPalette(palette);

const { allQuestions, getValuesForQuestion } = useQuestions(PILOT_DATASET_ID);
const question =
	state?.question !== undefined && allQuestions.value.includes(state.question)
		? state.question
		: (allQuestions.value[0] ?? "");
const selectedVariants =
	state && available
		? restoreMapState(
				EMBED_MAP_ID,
				PILOT_DATASET_ID,
				question,
				getValuesForQuestion(question),
				state,
			)
		: [];

const { data, variantColors, variantGroups } = useMapData(
	EMBED_MAP_ID,
	PILOT_DATASET_ID,
	question,
	selectedVariants,
);

const fullMapLink = computed(() => localePath({ path: "/map", query: route.query }));

useSeoMeta({
	title: t("EmbedPage.title", { question }),
	robots: "noindex",
});
</script>

<template>
	<main id="main-content" class="flex h-dvh flex-col bg-background text-foreground">
		<template v-if="available">
			<header class="flex items-center justify-between gap-4 border-b px-4 py-2">
				<h1 class="truncate text-sm font-semibold">{{ question }}</h1>
				<a
					class="flex shrink-0 items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
					:href="fullMapLink"
					rel="noopener"
					target="_blank"
				>
					{{ t("EmbedPage.open") }}
					<ExternalLinkIcon class="size-3.5" />
				</a>
			</header>
			<div class="relative min-h-0 flex-1">
				<ClientOnly>
					<GeoMap
						:colors="variantColors"
						:controls="false"
						:data="data"
						fit
						:mode="state?.mode"
						:radius="state?.radius"
					/>
				</ClientOnly>
				<MapLegend
					:active-variants="selectedVariants"
					class="absolute bottom-4 left-4 z-10 max-h-[70%] overflow-y-auto"
					:dataset-id="PILOT_DATASET_ID"
					:groups="variantGroups"
					:question="question"
				/>
			</div>
		</template>
		<p v-else class="m-auto max-w-sm p-4 text-center text-sm text-muted-foreground">
			{{ t("EmbedPage.unavailable") }}
		</p>
	</main>
</template>
