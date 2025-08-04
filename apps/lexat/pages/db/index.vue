<script lang="ts" setup>
import type { InferResponseType } from "hono/client";
import { InfoIcon, MapPin, Quote, RotateCcw } from "lucide-vue-next";
import type { LocationQueryValue, RouteLocationNormalizedLoaded } from "vue-router";

import { getRegisterOptions, specialOrder } from "@/assets/data/static-filter-data";
import type { SortOder, TableColumn } from "@/components/data-table.vue";
import { useQuestions } from "@/composables/use-questions";
import type { DropdownOption } from "@/types/dropdown-option";

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

const activeAgeGroup = ref([0, 100]);
const activeQuestion = ref<string>("11");
const activePageSizeQuery = ref<number>(100);
const activePageSize = ref<string>("100");
const activeRegisters = ref<Array<string>>(["all"]);
const activeVariants = ref<Array<string>>(["all"]);
// const debouncedActiveAgeGroup = refDebounced(activeAgeGroup, 250); // using debounce prevents useFetch's native req cancelling
const activeQuestionId = computed(() => parseInt(activeQuestion.value));
const activeSortLabel = ref<string | null>(null);
const activeSortDirection = ref<SortOder | null>(null);

const currentPage = ref(1);

if (typeof route.query.q === "string") {
	activeQuestion.value = route.query.q;
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

const uniqueVariantsOptions = computed((): Array<DropdownOption> => {
	const variantOptions =
		annotations.value
			?.map((variant) => ({
				label: variant.annotation_name,
				value: variant.annotation_name,
				level: 1,
				group: variant.annotation_name?.toLocaleLowerCase(),
			}))
			.sort((a, b) => {
				// extract priority values from the specialOrder object or default to 0
				const priorityA = specialOrder[a.label] ?? 0;
				const priorityB = specialOrder[b.label] ?? 0;

				// sort by priority, with lower values appearing later
				return priorityB - priorityA;
			}) ?? [];
	variantOptions.unshift({
		label: t("MapsPage.selection.register.show-all") || "Alle anzeigen",
		value: "all",
		level: 0,
		group: "all",
	});
	return variantOptions;
});

const pageSizeOption: Array<DropdownOption> = [
	{ id: 1, value: "100", label: "100" },
	{ id: 2, value: "250", label: "250" },
	{ id: 3, value: "500", label: "500" },
	{ id: 4, value: "1000", label: "1000" },
];

const lowerAge = computed(() => {
	return activeAgeGroup.value[0];
});

const upperAge = computed(() => {
	return activeAgeGroup.value[1];
});

const _getTableData = apiClient.questions.table[":id"].$get;
type APITableData = InferResponseType<typeof _getTableData, 200>;
const {
	data: tableDataRaw,
	status,
	refresh,
} = await useFetch<APITableData>(() => `/questions/table/${activeQuestionId.value}`, {
	query: {
		page: currentPage,
		pageSize: activePageSizeQuery,
		varIds: activeRegistersQuery,
		annotations: activeVariantsQuery,
		lowerAge,
		upperAge,
		orderBy: activeSortLabel,
		dir: activeSortDirection,
	},
	baseURL: env.public.apiBaseUrl,
	method: "get",
	credentials: "include",
});

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
	return tableDataRaw.value?.totalResults
		? Math.ceil(tableDataRaw.value.totalResults / activePageSizeQuery.value)
		: 0;
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

const resetSelection = async (omit?: Array<"age" | "question" | "register">) => {
	if (!omit?.includes("age")) {
		activeAgeGroup.value = [0, 100];
	}
	if (!omit?.includes("question")) {
		activeQuestion.value = "11";
	}
	if (!omit?.includes("register")) {
		activeRegisters.value = ["all"];
	}
	activeVariants.value = ["all"];
	activeSortLabel.value = null;
	activeSortDirection.value = null;
};

const updateUrlParams = async () => {
	const queryObject: Record<string, string | Array<string>> = {};
	Object.entries(route.query).forEach(([key, value]) => {
		if (!["a", "q", "r", "v", "c", "sv"].includes(key)) {
			queryObject[key] = value;
		}
	});

	if (activeAgeGroup.value.length > 0) {
		queryObject.a = activeAgeGroup.value.toString();
	}
	if (activeQuestion.value) {
		queryObject.q = activeQuestion.value;
	}
	if (activeRegisters.value.length > 0) {
		queryObject.r = activeRegisters.value;
	}
	if (activeVariants.value.length > 0) {
		queryObject.v = activeVariants.value.filter((aV) => aV !== "Keine Angabe");
	}

	await router.replace({
		query: queryObject,
	});
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
		query: route.query,
	});
};

const totalResults = computed(() => {
	return tableDataRaw.value?.totalResults;
});

const handleDownload = async (): Promise<void> => {
	const result = await $fetch<APITableData>(`/questions/table/${activeQuestionId.value}`, {
		query: {
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

watch(
	activeQuestion,
	async () => {
		activeRegisters.value = ["all"];
		activeAgeGroup.value = [0, 100];
		activeVariants.value = ["all"];
		activeSortLabel.value = null;
		activeSortDirection.value = null;
		setCurrentPage(1);
		await updateUrlParams();
	},
	{ immediate: true },
);

watch([activeRegisters, activeAgeGroup, activeVariants], async () => {
	setCurrentPage(1);
	await updateUrlParams();
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

await initializeFromUrl();
await refresh(); // manually refetch using updated state
</script>

<template>
	<MainContent class="container grid content-start py-8 overflow-x-scroll sm:overflow-x-auto">
		<MobileAlert />
		<section class="flex gap-2">
			<div class="grow rounded-lg border p-5 mb-4">
				<div class="grid grid-cols-4 gap-5">
					<div>
						<div class="mb-1 ml-1 flex gap-1 text-sm font-semibold">
							{{ t("MapsPage.selection.variable.title") }}
							<InfoTooltip :content="t('MapsPage.selection.variable.tooltip')">
								<InfoIcon class="size-4"></InfoIcon>
							</InfoTooltip>
						</div>
						<Combobox
							v-model="activeQuestion"
							data-testid="questions"
							has-search
							:options="mappedQuestions"
							:placeholder="t('MapsPage.selection.variable.placeholder')"
						/>
					</div>
					<div>
						<div class="mb-1 ml-1 flex gap-1 text-sm font-semibold">
							{{ t("MapsPage.selection.register.title") }}
							<InfoTooltip :content="t('MapsPage.selection.register.tooltip')">
								<InfoIcon class="size-4"></InfoIcon>
							</InfoTooltip>
						</div>
						<MultiSelect
							v-model="activeRegisters"
							data-testid="registers"
							:options="registerOptions"
							:placeholder="t('MapsPage.selection.register.placeholder')"
						/>
					</div>
					<div>
						<div class="mb-1 ml-1 flex gap-1 text-sm font-semibold">
							{{ t("MapsPage.selection.variants.title") }}
							<InfoTooltip :content="t('MapsPage.selection.variants.tooltip')">
								<InfoIcon class="size-4"></InfoIcon>
							</InfoTooltip>
						</div>
						<MultiSelect
							v-model="activeVariants"
							data-testid="variants"
							:options="uniqueVariantsOptions"
							:placeholder="t('MapsPage.selection.variants.placeholder')"
							single-level
						/>
					</div>
					<div>
						<div class="mb-7 ml-1 flex gap-1 text-sm font-semibold">
							{{ t("MapsPage.selection.age.title") }}
						</div>
						<div class="max-w-64 pl-1">
							<DualRangeSlider
								accessibility-label="Age Group"
								:label="(value) => value"
								:max="100"
								:min="0"
								:step="5"
								:value="activeAgeGroup"
								@update:value="setAgeGroup"
							/>
						</div>
					</div>
				</div>
			</div>
			<div class="flex flex-col gap-2">
				<Button data-testid="reset" size="icon" variant="outline" @click="resetSelection()"
					><RotateCcw class="size-4"
				/></Button>
			</div>
		</section>

		<section class="flex justify-between items-center mb-3">
			<div class="text-2xl font-semibold">
				{{ tableDataRaw?.totalResults ?? 0 }} {{ t("DbPage.table.results") }}
			</div>
			<div class="flex items-center gap-2">
				<Label for="rows-per-page">{{ t("DbPage.table.items-per-page") }}:</Label>
				<Combobox
					id="rows-per-page"
					v-model="activePageSize"
					data-testid="rows-per-page"
					:options="pageSizeOption"
					:placeholder="t('AdminPage.editor.category.placeholder')"
					width="w-24"
				/>
			</div>
		</section>

		<DataTable
			class="mb-3"
			:columns="columns"
			:data="tableData"
			:is-loading="status === 'pending'"
			server-side-sorting
			@download-csv="handleDownload"
			@update:sort-criterion="setSortOrder"
		>
			<template #left>
				<div class="mr-auto">
					<Popover>
						<PopoverTrigger>
							<Button variant="outline"
								><Quote class="mr-2 size-4" />{{ t("DbPage.citation") }}</Button
							></PopoverTrigger
						>
						<PopoverContent class="w-lg" side="right">
							<p class="italic mb-4 border p-5 rounded-sm">{{ citation }}</p>
							<CopyToClipboard :text="citation" />
						</PopoverContent>
					</Popover>
				</div>
			</template>
			<template #right>
				<Button @click="goToMapsPage"
					><MapPin class="mr-2 size-4" />{{ t("DbPage.go-to-maps") }}</Button
				>
			</template>
		</DataTable>
		<PagePagination
			:current-page="currentPage"
			:items-per-page="activePageSizeQuery"
			:total-pages="totalPages"
			@update:page="setCurrentPage"
		></PagePagination>
	</MainContent>
</template>
