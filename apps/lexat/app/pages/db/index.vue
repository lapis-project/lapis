<script lang="ts" setup>
import type { InferResponseType } from "hono/client";
import type {
	LocationQueryRaw,
	LocationQueryValue,
	RouteLocationNormalizedLoaded,
} from "vue-router";

import { getRegisterOptions, specialOrder } from "@/assets/data/static-filter-data";
import type { SortOder, TableColumn } from "@/components/data-table.vue";
import type StimulusDialog from "@/components/stimulus-dialog.vue";

const t = useTranslations();
const router = useRouter();
const route = useRoute();
const env = useRuntimeConfig();
const { apiClient } = useApiClient();
const localePath = useLocalePath();

usePageMetadata({
	title: t("DbPage.meta.title"),
});

const registerOptions = getRegisterOptions(t);

const surveyParams = [route.query.sr]
	.flat()
	.filter((value): value is string => value === "1" || value === "2");
const activeSurveyRounds = ref<Array<string>>(surveyParams.length ? surveyParams : ["1", "2"]);
const open = ref(false);
const { questions, status: questionsStatus } = await useQuestions(() =>
	activeSurveyRounds.value.length === 1 ? activeSurveyRounds.value[0] : undefined,
);
const surveyRoundOptions = computed(() =>
	["1", "2"].map((value) => ({
		value,
		label: t(
			value === "1"
				? "MapsPage.selection.survey.options.one"
				: "MapsPage.selection.survey.options.two",
		),
		disabled: activeSurveyRounds.value.length === 1 && activeSurveyRounds.value.includes(value),
	})),
);
const updateActiveSurveyRounds = (selection: Array<string>) => {
	if (selection.length) activeSurveyRounds.value = selection;
};

const mappedQuestions = computed(() => {
	return (
		questions.value?.map((q) => ({
			id: q.id,
			value: q.id.toString(),
			label: q.phenomenon_name ?? "n/A",
		})) ?? []
	);
});

const activeRegistersQuery = computed(() => {
	if (activeRegisters.value.includes("all")) {
		return null;
	} else {
		return activeRegisters.value.map((r) => Number(r));
	}
});

const activeVariantsQuery = computed(() => {
	if (activeVariants.value.includes("all")) {
		return null;
	} else {
		return activeVariants.value;
	}
});

// TODO MAYBE RETHINK ENDPOINT, THE CURRENT MAPPING IS KINDA EXCESSIVE
// const _getVarieties = apiClient.questions.variety.$get;
// type APIVarieties = InferResponseType<typeof _getVarieties, 200>;
// const { data: varieties } = await useFetch<APIVarieties>("/questions/variety", {
// 	baseURL: env.public.apiBaseUrl,
// 	method: "GET",
// });

// const mappedVarieties = computed(() => {
// 	return (
// 		varieties.value?.map((q) => ({
// 			id: q.variety_entry.id,
// 			value: q.variety_entry.,
// 			label: q.phenomenon_name,
// 		})) ?? null
// 	);
// });

const initialQuestion =
	mappedQuestions.value.find((question) => question.id === 11) ?? mappedQuestions.value[0];

const activeAgeGroup = ref([0, 100]);
const activeQuestion = ref<(typeof mappedQuestions.value)[number] | undefined>(initialQuestion);
const activePageSizeQuery = ref<number>(100);
const activePageSize = ref<string>("100");
const activeRegisters = ref<Array<string>>(["all"]);
const activeVariants = ref<Array<string>>(["all"]);
const registerSelectOpen = ref(false);
const variantSelectOpen = ref(false);
// const debouncedActiveAgeGroup = refDebounced(activeAgeGroup, 250); // using debounce prevents useFetch's native req cancelling
const activeQuestionId = computed(() => activeQuestion.value?.id);
const activeSortLabel = ref<string | null>(null);
const activeSortDirection = ref<SortOder | null>(null);

const currentPage = ref(1);

const onboardingWrapper = ref<{ startOnboarding: () => void } | null>(null);

if (typeof route.query.q === "string") {
	activeQuestion.value = mappedQuestions.value.find((q) => q.value === route.query.q);
}

const _getAnnotations = apiClient.questions.annotation[":project"].$get;
type APIAnnotation = InferResponseType<typeof _getAnnotations, 200>;
const { data: annotations } = await useFetch<APIAnnotation>("/questions/annotation/1", {
	query: {
		phenomenon: activeQuestionId,
	},
	baseURL: env.public.apiBaseUrl,
	method: "GET",
	credentials: "include",
	server: false,
});

const stimulusDialogRef = ref<InstanceType<typeof StimulusDialog> | null>(null);

function handleShowImage() {
	stimulusDialogRef.value?.openDialog();
}

const uniqueVariantsOptions = computed<Array<{ label: string; value: string }>>(() => {
	const variantOptions =
		annotations.value
			?.flatMap((variant) => {
				const name = variant.annotation_name;
				return name ? [{ label: name, value: name }] : [];
			})
			.toSorted((a, b) => {
				// extract priority values from the specialOrder object or default to 0
				const priorityA =
					a.label && a.label in specialOrder
						? specialOrder[a.label as keyof typeof specialOrder]
						: 0;

				const priorityB =
					b.label && b.label in specialOrder
						? specialOrder[b.label as keyof typeof specialOrder]
						: 0;

				// sort by priority, with lower values appearing later
				return priorityB - priorityA;
			}) ?? [];
	variantOptions.unshift({
		label: t("MapsPage.selection.register.show-all") || "Alle anzeigen",
		value: "all",
	});
	return variantOptions;
});

const updateActiveVariants = (selection: Array<string>) => {
	const wasAllSelected = activeVariants.value.includes("all");
	const isAllSelected = selection.includes("all");

	if (isAllSelected && !wasAllSelected) {
		// Selecting "all" replaces any individual variants.
		activeVariants.value = ["all"];
	} else if (isAllSelected) {
		// Selecting an individual variant while "all" is active makes it the new selection.
		activeVariants.value = selection.filter((variant) => variant !== "all");
	} else {
		// An empty selection has the same filter semantics as "all", so keep the state explicit.
		activeVariants.value = selection.length > 0 ? selection : ["all"];
	}
};

const pageSizeOptions = ref(["100", "250", "500", "1000"]);

const lowerAge = computed(() => {
	return activeAgeGroup.value[0];
});

const upperAge = computed(() => {
	return activeAgeGroup.value[1];
});

const _getTableData = apiClient.questions.table[":id"].$get;
type APITableData = InferResponseType<typeof _getTableData, 200>;
const tableQuery = computed(() => ({
	page: currentPage.value,
	pageSize: activePageSizeQuery.value,
	varIds: activeRegistersQuery.value,
	annotations: activeVariantsQuery.value,
	lowerAge: lowerAge.value,
	upperAge: upperAge.value,
	orderBy: activeSortLabel.value,
	dir: activeSortDirection.value,
	surveyIds: activeSurveyRounds.value,
}));
const {
	data: tableDataRaw,
	status,
	refresh,
} = await useAsyncData(
	() => `db-table:${activeQuestionId.value}:${JSON.stringify(tableQuery.value)}`,
	async () => {
		if (activeQuestionId.value === undefined) return { responses: [], totalResults: 0 };
		return await $fetch<APITableData>(`/questions/table/${activeQuestionId.value}`, {
			query: tableQuery.value,
			baseURL: env.public.apiBaseUrl,
			method: "GET",
			credentials: "include",
		});
	},
);

const columns = ref<Array<TableColumn>>([
	{ label: t("DbPage.table.infid"), value: "informant", criterion: "infid", sortable: false },
	{
		label: t("DbPage.table.response"),
		value: "response",
		criterion: "response_text",
		sortable: true,
	},
	{
		label: t("DbPage.table.annotation"),
		value: "annotation",
		criterion: "annotation",
		sortable: true,
	},
	// { label: "Phänomen", value: "",criterion: "phenomenon", sortable: true },
	{ label: t("DbPage.table.variety"), value: "variety", criterion: "variety_name", sortable: true },
	{ label: t("DbPage.table.place"), value: "place", criterion: "place_name", sortable: true },
	{ label: t("DbPage.table.age-group"), value: "age", criterion: "age_group_name", sortable: true },
]);

const tableData = computed(() => {
	return tableDataRaw.value?.responses;
});

const totalPages = computed(() => {
	return tableDataRaw.value?.totalResults ?? 0;
});

const setCurrentPage = (newValue: number) => {
	if (currentPage.value !== newValue) {
		currentPage.value = newValue;
	}
};

const setAgeGroup = (newValues: Array<number>) => {
	activeAgeGroup.value = newValues;
};

const setSortOrder = (label: string, order: SortOder) => {
	activeSortLabel.value = label;
	activeSortDirection.value = order;
};

const resetSelection = async (omit?: Array<"age" | "question" | "register" | "survey">) => {
	if (!omit?.includes("age")) {
		activeAgeGroup.value = [0, 100];
	}
	if (!omit?.includes("question")) {
		activeQuestion.value = undefined;
	}
	if (!omit?.includes("survey")) {
		activeSurveyRounds.value = ["1", "2"];
	}
	if (!omit?.includes("register")) {
		activeRegisters.value = ["all"];
	}
	activeVariants.value = ["all"];
	activeSortLabel.value = null;
	activeSortDirection.value = null;
};

const getFilterQuery = (): LocationQueryRaw => {
	const queryObject: LocationQueryRaw = {};
	Object.entries(route.query).forEach(([key, value]) => {
		if (!["a", "q", "r", "v", "c", "sv", "sr"].includes(key)) {
			queryObject[key] = value;
		}
	});

	queryObject.sr = activeSurveyRounds.value;
	if (activeAgeGroup.value.length > 0) {
		queryObject.a = activeAgeGroup.value.toString();
	}
	if (activeQuestion.value) {
		queryObject.q = activeQuestion.value.value;
	}
	if (activeRegisters.value.length > 0) {
		queryObject.r = activeRegisters.value;
	}
	if (activeVariants.value.length > 0) {
		queryObject.v = activeVariants.value.filter((aV) => aV !== "Keine Angabe");
	}

	return queryObject;
};

const updateUrlParams = async () => {
	await router.replace({ query: getFilterQuery() });
};

const getQueryArray = (
	route: RouteLocationNormalizedLoaded,
	key: string,
): Array<LocationQueryValue> => {
	const value = route.query[key];
	if (Array.isArray(value)) return value;
	if (typeof value === "string") return [value];
	return [];
};

const initializeFromUrl = () => {
	const ageParams = getQueryArray(route, "a");
	if (ageParams.length > 0 && ageParams[0]) {
		activeAgeGroup.value = ageParams[0].split(",").map(Number);
	}
	const registerParams = getQueryArray(route, "r");
	if (registerParams.length > 0) {
		activeRegisters.value = registerParams.map(String);
	}
	const variantParams = getQueryArray(route, "v");
	if (variantParams.length > 0) {
		activeVariants.value = variantParams.map(String);
	}
};

const goToMapsPage = async (): Promise<void> => {
	await navigateTo({
		path: localePath("/maps"),
		query: getFilterQuery(),
	});
};

const totalResults = computed(() => {
	return tableDataRaw.value?.totalResults;
});

const handleDownload = async (): Promise<void> => {
	if (activeQuestionId.value === undefined) return;
	const result = await $fetch<APITableData>(`/questions/table/${activeQuestionId.value}`, {
		query: {
			surveyIds: activeSurveyRounds.value,
			page: 1,
			pageSize: totalResults.value,
			varIds: activeRegistersQuery.value,
			annotations: activeVariantsQuery.value,
			lowerAge: lowerAge.value,
			upperAge: upperAge.value,
			orderBy: activeSortLabel.value,
			dir: activeSortDirection.value,
		},
		baseURL: env.public.apiBaseUrl,
		method: "GET",
		credentials: "include",
	});
	if (result.responses) {
		const questionName =
			questions.value?.find((q) => q.id === activeQuestionId.value)?.phenomenon_name ?? "undefined";
		const fileName = `db-${questionName.toLowerCase()}`;
		downloadCSV(result.responses, columns.value, fileName);
	}
};

const citation = computed(() => {
	if (!import.meta.client) {
		return "";
	}

	// format date as DD.MM.YYYY in German (Austria) locale
	const formattedDate = new Date().toLocaleDateString("de-AT", {
		day: "2-digit",
		month: "2-digit",
		year: "numeric",
	});

	// build full URL including query parameters
	const url = window.location.origin + route.fullPath;
	const phenomenonName = questions.value?.find(
		(q) => q.id === activeQuestionId.value,
	)?.phenomenon_name;

	return `${phenomenonName} - Belegdaten. In: LexAT21: Atlas zur lexikalischen Variation in Österreich im 21. Jahrhundert. Herausgegeben von Alexandra N. Lenz. ${url}, abgerufen am ${formattedDate}.`;
});

initializeFromUrl();

onMounted(() => {
	void updateUrlParams();
});

watch([questions, questionsStatus], ([availableQuestions, fetchStatus]) => {
	if (fetchStatus !== "success" || !availableQuestions || !activeQuestion.value) return;
	if (!availableQuestions.some((question) => question.id === activeQuestion.value?.id)) {
		activeQuestion.value = undefined;
	}
});

watch(
	activeSurveyRounds,
	async (selection, previousSelection) => {
		if (selection.length < previousSelection.length) {
			await resetSelection(["survey"]);
		}
		setCurrentPage(1);
		await updateUrlParams();
	},
	{ deep: true },
);

watch(activeQuestion, async () => {
	activeRegisters.value = ["all"];
	activeAgeGroup.value = [0, 100];
	activeVariants.value = ["all"];
	activeSortLabel.value = null;
	activeSortDirection.value = null;
	setCurrentPage(1);
	await updateUrlParams();
});

watch([activeRegisters, activeAgeGroup, activeVariants], async () => {
	setCurrentPage(1);
	await updateUrlParams();
});

watch(registerSelectOpen, (open) => {
	if (open) {
		variantSelectOpen.value = false;
	}
});

watch(variantSelectOpen, (open) => {
	if (open) {
		registerSelectOpen.value = false;
	}
});

watch(
	activePageSize,
	(newVal, oldVal) => {
		if (newVal !== oldVal) {
			setCurrentPage(1);
			activePageSizeQuery.value = parseInt(newVal);
		}
	},
	{ immediate: true },
);

const steps = [
	{
		attachTo: { element: "#welcome" },
		content: {
			title: "Onboarding.Db-Onboarding.welcome.title",
			description: "Onboarding.Db-Onboarding.welcome.description",
		},
	},
	{
		attachTo: { element: "#phenomenon" },
		content: {
			title: "Onboarding.Db-Onboarding.phenomenon.title",
			description: "Onboarding.Db-Onboarding.phenomenon.description",
		},
	},
	{
		attachTo: { element: "#advanced" },
		content: {
			title: "Onboarding.Db-Onboarding.advanced.title",
			description: "Onboarding.Db-Onboarding.advanced.description",
		},
	},
	{
		attachTo: { element: "#reset" },
		content: {
			title: "Onboarding.Db-Onboarding.reset.title",
			description: "Onboarding.Db-Onboarding.reset.description",
		},
	},
	{
		attachTo: { element: "#download" },
		content: {
			title: "Onboarding.Db-Onboarding.download.title",
			description: "Onboarding.Db-Onboarding.download.description",
		},
	},
	{
		attachTo: { element: "#citation" },
		content: {
			title: "Onboarding.Db-Onboarding.citation.title",
			description: "Onboarding.Db-Onboarding.citation.description",
		},
	},
	{
		attachTo: { element: "#about" },
		content: {
			title: "Onboarding.Db-Onboarding.about.title",
			description: "Onboarding.Db-Onboarding.about.description",
		},
	},
];

const onOnboardingFinished = () => {
	const timestamp = new Date().toISOString();
	localStorage.setItem("db-onboarding", JSON.stringify({ finishedAt: timestamp }));
};

onMounted(() => {
	const onboardingData = localStorage.getItem("db-onboarding");

	if (!onboardingData) {
		onboardingWrapper.value?.startOnboarding();
	} else {
		const { finishedAt } = JSON.parse(onboardingData);
		// eslint-disable-next-line no-console
		console.info("Onboarding completed at:", finishedAt);
	}
});

const resetOnboarding = () => {
	localStorage.removeItem("db-onboarding");
	onboardingWrapper.value?.startOnboarding();
};

await refresh(); // manually refetch using updated state
</script>

<template>
	<MainContent class="container grid content-start py-8 overflow-x-scroll sm:overflow-x-auto">
		<MobileAlert class="mb-5" />
		<section id="welcome" class="mb-4 flex gap-2">
			<div class="grow rounded-lg border border-muted p-5">
				<div class="grid grid-cols-4 gap-5">
					<div id="surveyround">
						<div class="mb-1 ml-1 text-sm font-semibold align-center flex gap-1 items-center">
							{{ t("MapsPage.selection.survey.title") }}
							<UTooltip
								:content="{ side: 'top' }"
								:delay-duration="0"
								:text="t('MapsPage.selection.variable.tooltip')"
							>
								<UIcon name="i-lucide-info" class="size-4" />
							</UTooltip>
						</div>
						<USelect
							data-testid="survey"
							:items="surveyRoundOptions"
							:model-value="activeSurveyRounds"
							multiple
							size="lg"
							class="w-64"
							@update:model-value="updateActiveSurveyRounds"
						/>
					</div>
					<div id="phenomenon">
						<div class="mb-1 ml-1 text-sm font-semibold flex gap-1 items-center">
							{{ t("MapsPage.selection.variable.title") }}
							<UTooltip
								:content="{ side: 'top' }"
								:delay-duration="0"
								:text="t('MapsPage.selection.variable.tooltip')"
							>
								<UIcon name="i-lucide-info" class="size-4" />
							</UTooltip>
						</div>
						<USelectMenu
							v-model="activeQuestion"
							data-testid="questions"
							:items="mappedQuestions"
							size="lg"
							:placeholder="t('MapsPage.selection.variable.placeholder')"
							class="w-64"
						/>
					</div>
					<div id="register">
						<div class="mb-1 ml-1 text-sm font-semibold flex gap-1 items-center">
							{{ t("MapsPage.selection.register.title") }}
							<UTooltip
								:content="{ side: 'top' }"
								:delay-duration="0"
								arrow
								:text="t('MapsPage.selection.register.tooltip')"
							>
								<UIcon name="i-lucide-info" class="size-4" />
							</UTooltip>
						</div>
						<RegisterSelect
							v-model="activeRegisters"
							v-model:open="registerSelectOpen"
							data-testid="registers"
							:options="registerOptions"
							:placeholder="t('MapsPage.selection.register.placeholder')"
						/>
					</div>
					<div id="variant">
						<div class="mb-1 ml-1 text-sm font-semibold flex gap-1 items-center">
							{{ t("MapsPage.selection.variants.title") }}
							<UTooltip
								:content="{ side: 'top' }"
								:delay-duration="0"
								arrow
								:text="t('MapsPage.selection.variants.tooltip')"
							>
								<UIcon name="i-lucide-info" class="size-4" />
							</UTooltip>
						</div>
						<USelect
							data-testid="variants"
							v-model:open="variantSelectOpen"
							:model-value="activeVariants"
							multiple
							size="lg"
							:items="uniqueVariantsOptions"
							:placeholder="t('MapsPage.selection.variants.placeholder')"
							class="w-62"
							@update:model-value="updateActiveVariants"
						/>
					</div>
				</div>
				<UCollapsible id="db-extended-filters" v-model:open="open">
					<template #content>
						<hr class="mt-5 border-muted" />
						<div class="mt-4 grid grid-cols-4 gap-5">
							<div id="age-group">
								<div class="ml-1 flex gap-1 text-sm font-semibold">
									{{ t("MapsPage.selection.age.title") }}
								</div>
								<div class="max-w-64 pl-1">
									<DualRangeSlider
										accessibility-label="Age Group"
										:max="100"
										:min="0"
										:step="5"
										:value="activeAgeGroup"
										@update:value="setAgeGroup"
									/>
								</div>
							</div>
						</div>
					</template>
				</UCollapsible>
			</div>
			<div class="grid content-start gap-2">
				<UButton
					id="reset"
					data-testid="reset"
					size="lg"
					color="neutral"
					variant="outline"
					icon="i-lucide-rotate-ccw"
					@click="resetSelection()"
				/>
				<UButton
					id="advanced"
					data-testid="advanced"
					aria-controls="db-extended-filters"
					aria-label="Toggle advanced filters"
					:aria-expanded="open"
					size="lg"
					color="neutral"
					variant="outline"
					square
					@click="open = !open"
				>
					<UIcon
						name="i-lucide-chevron-down"
						class="size-5 transition-transform"
						:class="{ 'rotate-180': open }"
					/>
				</UButton>
			</div>
		</section>

		<section class="flex justify-between items-center mb-3">
			<div class="text-2xl font-semibold">
				{{ tableDataRaw?.totalResults ?? 0 }} {{ t("DbPage.table.results") }}
			</div>
			<div class="flex items-center gap-2">
				<label class="text-sm font-medium text-default" for="rows-per-page">
					{{ t("DbPage.table.items-per-page") }}:
				</label>
				<USelect
					id="rows-per-page"
					v-model="activePageSize"
					data-testid="rows-per-page"
					:items="pageSizeOptions"
					size="lg"
					class="w-32"
				/>
			</div>
		</section>

		<DataTable
			class="mb-3"
			:columns="columns"
			:data="activeQuestionId === undefined ? [] : (tableData ?? [])"
			:empty-message="
				activeQuestionId === undefined
					? t('DbPage.table.no-phenomenon')
					: t('DbPage.table.no-results')
			"
			fixed-height
			:is-loading="status === 'pending'"
			server-side-sorting
			@download-csv="handleDownload"
			@update:sort-criterion="setSortOrder"
		>
			<template #left>
				<div class="mr-auto flex items-center gap-3">
					<UPopover
						:content="{
							align: 'center',
							side: 'right',
							sideOffset: 8,
						}"
					>
						<UButton id="citation" variant="outline" color="neutral" size="lg"
							><UIcon name="i-lucide-quote" class="size-4" />{{ t("DbPage.citation") }}</UButton
						>
						<template #content>
							<div class="p-5 max-w-lg">
								<p class="italic mb-4">{{ citation }}</p>
								<CopyToClipboard :text="citation" />
							</div>
						</template>
					</UPopover>
					<UButton
						id="resetOnboarding"
						variant="outline"
						color="neutral"
						size="lg"
						@click="resetOnboarding"
					>
						<UIcon name="i-lucide-circle-question-mark" class="size-5" />
						{{ t("DbPage.help") }}</UButton
					>
					<UButton
						v-if="stimulusDialogRef?.hasImage"
						id="showStimulus"
						variant="outline"
						color="neutral"
						size="lg"
						@click="handleShowImage"
					>
						<UIcon name="i-lucide-image" class="size-5" /> {{ t("DbPage.image") }}</UButton
					>
				</div>
			</template>
			<template #right>
				<UButton @click="goToMapsPage" size="lg"
					><UIcon name="i-lucide-map-pin" class="size-5" />{{ t("DbPage.go-to-maps") }}</UButton
				>
			</template>
		</DataTable>
		<UPagination
			v-if="totalPages > activePageSizeQuery"
			:items-per-page="activePageSizeQuery"
			:page="currentPage"
			show-edges
			:total="totalPages"
			class="mx-auto"
			@update:page="setCurrentPage"
		/>
		<OnboardingWrapper
			ref="onboardingWrapper"
			:steps="steps"
			@finished-onboarding="onOnboardingFinished"
		>
		</OnboardingWrapper>
		<StimulusDialog ref="stimulusDialogRef" :phenomenon-id="activeQuestionId ?? null" />
	</MainContent>
</template>
