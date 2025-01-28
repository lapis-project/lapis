<script lang="ts" setup>
import { keyByToMap } from "@acdh-oeaw/lib";
import { refDebounced } from "@vueuse/core";
import {
	ChevronDownIcon,
	InfoIcon,
	MapPinIcon,
	Maximize2Icon,
	Minimize2Icon,
	RotateCcwIcon,
	UserIcon,
} from "lucide-vue-next";
import type { MapGeoJSONFeature } from "maplibre-gl";
import { useRoute, useRouter } from "nuxt/app";
import type { LocationQueryValue, RouteLocationNormalizedLoaded } from "vue-router";

import austriaGeoBoundaries from "@/assets/data/austria-lexat21-optimized.geojson.json";
import dialectRegions from "@/assets/data/dialektregionen-lexat21-optimized.geojson.json";
import type { TableColumn, TableEntry } from "@/components/data-table.vue";
import { useMapColors } from "@/composables/use-map-colors";
import type { DropdownOption } from "@/types/dropdown-option";
import type {
	RegionFeature,
	SurveyResponse,
	SurveyResponseProperty,
} from "@/types/feature-collection";
import type { GeoJsonFeature } from "@/utils/create-geojson-feature";
import { countUniqueVariants, getSortedVariants } from "@/utils/variant-helper";

import CopyToClipboard from "./copy-to-clipboard.vue";
import MultiSelect from "./multi-select.vue";

const t = useTranslations();
const router = useRouter();
const route = useRoute();
const env = useRuntimeConfig();

const popover = ref<{ coordinates: [number, number]; entities: Array<SurveyResponse> } | null>(
	null,
);

const { colors, specialColors, resetColors } = useMapColors();

const stateCapitalsList = [
	"Wien",
	"St. Pölten",
	"Graz",
	"Linz",
	"Innsbruck",
	"Klagenfurt",
	"Salzburg",
	"Bregenz",
	"Eisenstadt",
];

// https://medium.com/@go2garret/free-basemap-tiles-for-maplibre-18374fab60cb
const basemapOptions: Array<DropdownOption> = [
	{
		label: "OpenStreetMaps",
		value:
			"https://raw.githubusercontent.com/go2garret/maps/main/src/assets/json/openStreetMap.json",
	},
	{
		label: "Light-themed (Positron)",
		value: "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json",
	},
	{
		label: "Detailed street map (Voyager)",
		value: "https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json",
	},
	{
		label: "Dark-themed (Dark Matter)",
		value: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
	},
	{
		label: "Hypsometry (ICGC)",
		value: "https://geoserveis.icgc.cat/contextmaps/icgc_ombra_hipsometria_corbes.json",
	},
];

const registerOptions: Array<DropdownOption> = [
	{
		label: t("MapsPage.selection.register.show-all"),
		value: "all",
		level: 0,
	},
	{
		label: "Standardsprachliche Register",
		value: "st",
		level: 1,
		group: "st",
	},
	{
		label: "Ihr Hochdeutsch",
		value: "hd",
		level: 2,
		group: "st",
	},
	{
		label: "Ihr österreichisches Hochdeutsch",
		value: "oehd",
		level: 2,
		group: "st",
	},
	{
		label: "Ihr bestes Hochdeutsch",
		value: "bhd",
		level: 2,
		group: "st",
	},
	{
		label: "Standardfernere Register",
		value: "diaf",
		level: 1,
		group: "dia",
	},
	{
		label: "Dialekt (Mundart)",
		value: "dia",
		level: 2,
		group: "dia",
	},
	{
		label: "Umgangssprache oder Alltagssprache",
		value: "usas",
		level: 2,
		group: "dia",
	},
];

const registerGroups = [
	{
		name: "dia",
		values: ["Dialekt (Mundart)", "Umgangssprache oder Alltagssprache"],
	},
	{
		name: "st",
		values: ["Ihr Hochdeutsch", "Ihr bestes Hochdeutsch", "Ihr österreichisches Hochdeutsch"],
	},
];

const { data: questions } = await useFetch<
	Array<{ id: number; phenomenon_name: string; description: string | null }>
>("/questions/survey/1", {
	baseURL: env.public.apiBaseUrl,
	method: "GET",
});

const mappedQuestions = computed(() => {
	return (
		questions.value?.map((q) => ({
			id: q.id,
			value: q.phenomenon_name,
			label: q.phenomenon_name,
		})) ?? null
	);
});

const activeAgeGroup = ref([10, 100]);
const changedColors = ref<Record<string, string>>({});
const debouncedActiveAgeGroup = refDebounced(activeAgeGroup, 250);
const activeBasemap = ref<string>("https://basemaps.cartocdn.com/gl/positron-gl-style/style.json");
const activeQuestion = ref<string | null>(null);
const activeRegisters = ref<Array<string>>(["all"]);
const activeVariants = ref<Array<string>>([]);
const mapExpanded = ref<boolean>(false);
const simplifiedView = ref<boolean>(true);
const showRegionNames = ref<boolean>(false);
const showRegions = ref<boolean>(true);
const showStateCapitals = ref<boolean>(true);
const showUrbanLocations = ref<boolean>(true);
const showAdvancedFilters = ref<boolean>(false);

const activeQuestionId = computed(() => {
	return mappedQuestions.value?.find((q) => q.value === activeQuestion.value)?.id;
});

const { data: questionData } = await useFetch<Array<SurveyResponse>>("/questions", {
	query: { id: activeQuestionId, project: "1" },
	baseURL: env.public.apiBaseUrl,
	method: "get",
});

const specialOrder = {
	// "keine Angabe": -3, // -3 indicates key to be sorted last
	Irrelevant: -2,
	Sonstige: -1,
};

const entities = computed((): Array<RegionFeature> => {
	return dialectRegions.features;
});

const points = computed(() => {
	let features = questionData.value ?? [];
	features.forEach((f) => {
		if (Array.isArray(f.coalesce)) {
			// filter the answers array to remove answers with annotation "Keine Angabe"
			f.coalesce.forEach((entry) => {
				entry.answers = entry.answers.filter((answer) => answer.annotation !== "Keine Angabe");
			});
		}
		f.id = `${f.plz.toString()}-${f.place_name}`;
	});

	// TODO experiment without Vienna point
	// features = features.filter((f) => f.place_name !== "Wien");

	// only entries with coordinates are considered valid points
	// let filteredFeatures = features.filter((f) => f.geometry.coordinates);

	if (!activeRegisters.value.includes("all")) {
		const activeRegisterLabels: Array<string> = [];
		for (const register of activeRegisters.value) {
			const label = registerOptions.find((r) => r.value === register)?.label;
			if (label) {
				activeRegisterLabels.push(label);
			}
		}
		features = features
			.map((feature) => {
				const filteredProperties = feature.coalesce
					.map((property) => {
						const filteredAnswers = property.answers.filter((answer) =>
							activeRegisterLabels.includes(answer.variety),
						);
						return { ...property, answers: filteredAnswers };
					})
					.filter((property) => property.answers.length > 0);

				return { ...feature, coalesce: filteredProperties };
			})
			.filter((feature) => feature.coalesce.length > 0);
	}
	return features;
});

/**
 * Reduce size of geojson payload, which has an impact on performance,
 * because `maplibre-gl` will serialize geojson features when sending them to the webworker.
 */
const features = computed(() => {
	return entities.value.map((entity) => {
		return createSimpleGeoJsonFeature(entity);
	});
});

const geoOutline = computed(() => {
	return austriaGeoBoundaries.features.map((entity) => {
		return createOutlineGeoJsonFeature(entity);
	});
});

const mappedColors = computed(() => {
	const colorMap: Record<string, string> = {};

	const tempColors = [...colors.value];

	uniqueVariants.value.forEach((u, i) => {
		// apply distinct colors for "Irrelevant" and "Sonstige"
		if (Object.keys(specialOrder).includes(u.anno)) {
			tempColors[i] = specialColors.value[u.anno];
		}
		const color = tempColors[i];

		if (color) {
			colorMap[u.anno] = color;
		}
	});
	return colorMap;
});

const filteredPoints = computed(() => {
	let filteredPoints = points.value;
	if (activeVariants.value.length) {
		filteredPoints = filteredPoints
			.map((entry) => {
				const filteredCoalesce = entry.coalesce // Make sure this is referring to 'coalesce'
					.map((property) => {
						const filteredAnswers = property.answers.filter((answer) =>
							activeVariants.value.includes(answer.annotation),
						);
						return { ...property, answers: filteredAnswers };
					})
					.filter((property) => property.answers.length > 0);

				return { ...entry, coalesce: filteredCoalesce }; // Properly assign the filtered coalesce here
			})
			.filter((entry) => entry.coalesce.length > 0); // Filter out entries with no remaining coalesce properties
	}

	filteredPoints = filteredPoints
		.map((item) => {
			const filteredProperties = item.coalesce.filter((prop) => {
				const ageBounds = prop.age.split("-");
				return (
					ageBounds[0] >= (debouncedActiveAgeGroup.value[0] ?? 10) &&
					ageBounds[1] <= (debouncedActiveAgeGroup.value[1] ?? 100)
				);
			});

			return {
				...item,
				coalesce: filteredProperties,
			};
		})
		.filter((item) => item.coalesce.length > 0);

	return filteredPoints;
});

// const dataPoints = computed(() => {
// 	const geoJsonPoints = filteredPoints.value.map((entity) => {
// 		return createGeoJsonFeature(entity, mappedColors.value);
// 	});

// 	return geoJsonPoints.sort((a, b) => b.properties.answerCount! - a.properties.answerCount!);
// });

const dataPoints = computed(() => {
	let visibleLocationPoints = structuredClone(filteredPoints.value);
	if (!showStateCapitals.value) {
		visibleLocationPoints = visibleLocationPoints.filter(
			(p) => !stateCapitalsList.includes(p.place_name),
		);
	}
	if (!showUrbanLocations.value) {
		visibleLocationPoints = visibleLocationPoints.filter((p) =>
			stateCapitalsList.includes(p.place_name),
		);
	}
	const geoJsonPoints = visibleLocationPoints.map((entity) => {
		return createGeoJsonFeature(entity, mappedColors.value);
	});

	return geoJsonPoints.sort((a, b) => b.properties.answerCount! - a.properties.answerCount!);
});

// const stateCapitals = computed(() => {
// 	const stateCapitalPoints = filteredPoints.value.filter(p => stateCapitalsList.includes(p.placeName))
// 	return stateCapitalPoints.map((entity) => {
// 		return createGeoJsonFeature(entity, mappedColors.value);
// 	});
// })

const entitiesById = computed(() => {
	return keyByToMap(filteredPoints.value, (entity) => {
		return entity.id;
	});
});

const filteredUniqueVariants = computed(() => {
	const countedUniqueVariants = countUniqueVariants(filteredPoints.value);
	return getSortedVariants(countedUniqueVariants, specialOrder);
});

const uniqueVariants = computed(() => {
	const countedUniqueVariants = countUniqueVariants(points.value);
	return getSortedVariants(countedUniqueVariants);
});

const uniqueVariantsOptions = computed((): Array<DropdownOption> => {
	return uniqueVariants.value
		.map((variant) => ({
			label: variant.anno,
			value: variant.anno,
			level: 1,
			group: variant.anno.toLocaleLowerCase(),
		}))
		.sort((a, b) => {
			// extract priority values from the specialOrder object or default to 0
			const priorityA = specialOrder[a.label] ?? 0;
			const priorityB = specialOrder[b.label] ?? 0;

			// sort by priority, with lower values appearing later
			return priorityB - priorityA;
		});
});

function onLayerClick(features: Array<MapGeoJSONFeature & Pick<GeoJsonFeature, "properties">>) {
	const entitiesMap = new Map<number, SurveyResponse>();
	for (const feature of features) {
		const entity = entitiesById.value.get(feature.properties.id);
		if (entity != null) {
			entitiesMap.set(feature.properties.id, entity);
		}
	}
	const entities = Array.from(entitiesMap.values());
	let coordinates = null;
	for (const entity of entities) {
		coordinates = [entity.lon, entity.lat];
	}
	if (coordinates) {
		popover.value = {
			coordinates: coordinates as [number, number],
			entities,
		};
	}
}

type OccurrenceCount = Record<
	string,
	{
		varieties: Record<string, number>;
		total: number;
	}
>;

const countOccurrences = (properties: Array<SurveyResponseProperty>) => {
	const occurrenceCount: Record<string, Record<string, number>> = {};

	for (const informant of properties) {
		for (const answer of informant.answers) {
			const annotation = answer.annotation;
			const variety = answer.variety;

			if (!occurrenceCount[annotation]) {
				occurrenceCount[annotation] = {};
			}

			if (!occurrenceCount[annotation][variety]) {
				occurrenceCount[annotation][variety] = 0;
			}

			// increment the count for a given variety of an annotation
			occurrenceCount[annotation][variety]++;
		}
	}

	// convert the occurrenceCount to an array and sort it
	const sortedOccurrences = Object.entries(occurrenceCount)
		.map(([annotation, varieties]) => ({
			annotation,
			varieties,
			total: Object.values(varieties).reduce((sum, count) => sum + count, 0),
		}))
		.sort((a, b) => {
			const aSpecialOrder = specialOrder[a.annotation] ?? 0;
			const bSpecialOrder = specialOrder[b.annotation] ?? 0;

			// sort by special order
			if (aSpecialOrder !== bSpecialOrder) {
				return bSpecialOrder - aSpecialOrder;
			}
			// if special orders are equal, sort by total answers
			return b.total - a.total;
		});

	// convert back to the desired format
	const sortedOccurrenceCount: OccurrenceCount = {};
	for (const item of sortedOccurrences) {
		sortedOccurrenceCount[item.annotation] = {
			varieties: item.varieties,
			total: item.total,
		};
	}

	return sortedOccurrenceCount;
};

const getEntityOccurrences = (entity: SurveyResponse) => {
	return countOccurrences(entity.coalesce ?? []);
};

const getEntityTotal = (entity: SurveyResponse) => {
	const occurrences = getEntityOccurrences(entity);
	return Object.values(occurrences).reduce((sum, item) => sum + item.total, 0);
};

// watch(data2, () => {
// 	/**
// 	 * Close popover when search results change, to avoid displaying popup for features which are
// 	 * no longer in the search results set.
// 	 */
// 	popover.value = null;
// });

const numberOfInformants = computed(() => {
	return filteredPoints.value.reduce((count, obj) => {
		return count + obj.coalesce.length;
	}, 0);
});

const tableData = computed(() => {
	const result = [];
	const countMap: Record<string, TableEntry> = {};

	filteredPoints.value.forEach((feature) => {
		const location = feature.place_name;

		feature.coalesce.forEach((property) => {
			property.answers.forEach((answer) => {
				const reg = answer.variety;
				const anno = answer.annotation;

				const key = `${location}-${reg}-${anno}`;

				if (!countMap[key]) {
					countMap[key] = {
						location: location,
						variant: anno,
						count: 0,
						register: reg,
					};
				}

				countMap[key].count += 1;
			});
		});
	});

	for (const key in countMap) {
		result.push(countMap[key]);
	}

	return result;
});

const tableDataForRegisters = computed(() => {
	const variantMap: Record<string, TableEntry> = {};

	filteredPoints.value.forEach((feature) => {
		feature.coalesce.forEach((property) => {
			property.answers.forEach((answer) => {
				const variant = answer.annotation;
				if (!variantMap[variant]) {
					variantMap[variant] = {
						variant,
						countDia: 0,
						countSt: 0,
						totalCount: 0,
					};
				}
				if (registerGroups[0]?.values.includes(answer.variety)) {
					variantMap[variant].countDia++;
				}
				if (registerGroups[1]?.values.includes(answer.variety)) {
					variantMap[variant].countSt++;
				}

				variantMap[variant].totalCount = variantMap[variant].countDia + variantMap[variant].countSt;
			});
		});
	});

	return Object.values(variantMap);
});

const fullRoute = computed(() => {
	return env.public.appBaseUrl + route.fullPath;
});

const sanititzeReg = (reg: string) => {
	if (reg === "Umgangssprache oder Alltagssprache") {
		return "Ugs. oder Alltagssprache";
	}
	return reg;
};

const columnsLocations = ref<Array<TableColumn>>([
	{
		label: t("MapsPage.table.locations.location.header"),
		value: "location",
		sortable: true,
		footer: t("MapsPage.table.locations.location.footer"),
	},
	{ label: t("MapsPage.table.locations.variant"), value: "variant", sortable: false },
	{ label: t("MapsPage.table.locations.count"), value: "count", sortable: true, sum: true },
	{
		label: t("MapsPage.table.locations.register.header"),
		value: "register",
		sortable: true,
		footer: t("MapsPage.table.locations.register.footer"),
	},
]);

const columnsRegisters = ref<Array<TableColumn>>([
	{
		label: t("MapsPage.table.registers.variant.header"),
		value: "variant",
		sortable: true,
		footer: t("MapsPage.table.registers.variant.footer"),
	},
	{ label: t("MapsPage.table.registers.countDia"), value: "countDia", sortable: true, sum: true },
	{ label: t("MapsPage.table.registers.countSt"), value: "countSt", sortable: true, sum: true },
	{
		label: t("MapsPage.table.registers.totalCount"),
		value: "totalCount",
		sortable: true,
		sum: true,
	},
]);

const getQueryArray = (
	route: RouteLocationNormalizedLoaded,
	key: string,
): Array<LocationQueryValue> => {
	const value = route.query[key];
	if (Array.isArray(value)) return value;
	if (typeof value === "string") return [value];
	return [];
};

const updateUrlParams = async () => {
	const queryObject: Record<string, string | Array<string>> = {};
	Object.entries(route.query).forEach(([key, value]) => {
		if (!["a", "q", "r", "v", "c"].includes(key)) {
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
		queryObject.v = activeVariants.value;
	}
	if (simplifiedView.value === false) {
		queryObject.sv = simplifiedView.value.toString();
	} else {
		delete queryObject.sv;
	}
	const colors = Object.values(changedColors.value);
	if (colors.length > 0) {
		queryObject.c = colors;
	}
	await router.replace({
		query: queryObject,
	});
};

const resetSelection = async (omit?: Array<"age" | "question" | "register">) => {
	if (!omit?.includes("age")) {
		activeAgeGroup.value = [10, 100];
	}
	if (!omit?.includes("question")) {
		activeQuestion.value = "";
	}
	if (!omit?.includes("register")) {
		activeRegisters.value = ["all"];
	}
	activeVariants.value = [];
	popover.value = null;
	changedColors.value = {};
	await updateUrlParams();
};

const initializeFromUrl = () => {
	const ageParams = getQueryArray(route, "a");
	if (ageParams.length > 0 && ageParams[0]) {
		activeAgeGroup.value = ageParams[0].split(",").map(Number);
	}
	const questionParam = route.query.q;
	if (typeof questionParam === "string") {
		activeQuestion.value = questionParam;
	}
	const registerParams = getQueryArray(route, "r");
	if (registerParams.length > 0) {
		activeRegisters.value = registerParams.map(String);
	}
	const variantParams = getQueryArray(route, "v");
	if (variantParams.length > 0) {
		activeVariants.value = variantParams.map(String);
	}
	const simplifiedViewParam = route.query.sv;
	if (typeof simplifiedViewParam === "string") {
		simplifiedView.value = false;
	}

	const colorParams = getQueryArray(route, "c");
	if (colorParams.length > 0) {
		colorParams.forEach((entry) => {
			if (entry) {
				// split string into index, hexcode and optional key for special colors
				// e.g. "1-#ffffff-i" to ["1", "#ffffff", "i"]
				const [index, hexCode, key] = entry.split("-");
				if (index && hexCode) {
					if (key === "i") {
						specialColors.value.Irrelevant = hexCode;
					} else if (key === "s") {
						specialColors.value.Sonstige = hexCode;
					} else {
						colors.value[index] = hexCode;
					}
					changedColors.value[index] = `${index}-${hexCode}${key ? `-${key}` : ""}`;
				}
			}
		});
	}
};

const setAgeGroup = (newValues: Array<number>) => {
	activeAgeGroup.value = newValues;
};

const handleColorUpdate = (index: number, newColor: string) => {
	let key = Object.keys(mappedColors.value)[index];
	if (key === "Irrelevant") {
		specialColors.value.Irrelevant = newColor;
		key = "i";
	} else if (key === "Sonstige") {
		specialColors.value.Sonstige = newColor;
		key = "s";
	} else {
		colors.value[index] = newColor;
		key = undefined;
	}
	// keep track of every color change to save them in url params
	changedColors.value[index] = `${index}-${newColor}${key ? `-${key}` : ""}`;
	updateUrlParams();
};

// Call the initialize function on component mount
initializeFromUrl();

watch(activeQuestion, async () => {
	await resetSelection(["question"]);
	resetColors();
});

watch(
	activeVariants,
	() => {
		popover.value = null;
	},
	{
		deep: true,
	},
);

watch(activeAgeGroup, async () => {
	popover.value = null;
	await updateUrlParams();
});

watch(simplifiedView, async () => {
	popover.value = null;
	await updateUrlParams();
});

watch(
	activeRegisters,
	async () => {
		await resetSelection(["age", "question", "register"]);
	},
	{
		deep: true,
	},
);

watch(activeVariants, updateUrlParams, {
	deep: true,
});
</script>

<template>
	<div class="relative flex flex-col gap-5">
		<Collapsible v-model:open="showAdvancedFilters">
			<div class="flex gap-2">
				<div class="grow rounded-lg border p-5">
					<div class="grid grid-cols-4 gap-5">
						<div>
							<div class="mb-1 ml-1 flex gap-1 text-sm font-semibold">
								{{ t("MapsPage.selection.variable.title") }}
								<InfoTooltip :content="t('MapsPage.selection.variable.tooltip')">
									<InfoIcon class="size-4"></InfoIcon>
								</InfoTooltip>
							</div>
							<Combobox
								v-if="mappedQuestions?.length"
								v-model="activeQuestion"
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
								:options="uniqueVariantsOptions"
								:placeholder="t('MapsPage.selection.variants.placeholder')"
								single-level
							/>
						</div>
						<div>
							<div class="mb-7 ml-1 flex gap-1 text-sm font-semibold">
								{{ t("MapsPage.selection.age.title") }}
							</div>
							<!-- <MultiSelect
								v-model="activeAgeGroup"
								:options="ageGroupOptions"
								:placeholder="t('MapsPage.selection.age.placeholder')"
								single-level
							/> -->
							<div class="max-w-64 pl-1">
								<DualRangeSlider
									accessibility-label="Age Group"
									:label="(value) => value"
									:max="100"
									:min="10"
									step="5"
									:value="activeAgeGroup"
									@update:value="setAgeGroup"
								/>
							</div>
						</div>
					</div>
					<CollapsibleContent>
						<hr class="mt-5" />
						<div class="mt-4 grid grid-cols-4 gap-5">
							<div>
								<div class="mb-1 ml-1 text-sm font-semibold">
									{{ t("MapsPage.selection.basemap.title") }}
								</div>
								<Combobox
									v-model="activeBasemap"
									has-search
									:options="basemapOptions"
									:placeholder="t('MapsPage.selection.basemap.placeholder')"
								/>
							</div>
							<div class="">
								<div class="mb-1 ml-1 text-sm font-semibold">Anzeigeoptionen</div>
								<div class="mb-2 flex w-64 space-x-2 self-center rounded border p-2">
									<Checkbox id="showData" v-model:checked="simplifiedView" />
									<label
										class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
										for="showData"
									>
										{{ t("MapsPage.selection.simplified-view") }}
									</label>
								</div>
								<div class="mb-2 flex w-64 space-x-2 self-center rounded border p-2">
									<Checkbox id="showRegionNames" v-model:checked="showRegionNames" />
									<label
										class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
										for="showRegionNames"
									>
										{{ t("MapsPage.selection.show-region-names") }}
									</label>
								</div>
								<div class="flex w-64 space-x-2 self-center rounded border p-2">
									<Checkbox id="showRegions" v-model:checked="showRegions" />
									<label
										class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
										for="showRegions"
									>
										{{ t("MapsPage.selection.show-regions") }}
									</label>
								</div>
							</div>
							<div class="">
								<div class="mb-1 ml-1 text-sm font-semibold">Ortspunkte filtern</div>
								<div class="mb-2 flex w-64 space-x-2 self-center rounded border p-2">
									<Checkbox id="showStateCapitals" v-model:checked="showStateCapitals" />
									<label
										class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
										for="showStateCapitals"
									>
										{{ t("MapsPage.selection.show-state-capitals") }}
									</label>
								</div>
								<div class="flex w-64 space-x-2 self-center rounded border p-2">
									<Checkbox id="showUrbanLocations" v-model:checked="showUrbanLocations" />
									<label
										class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
										for="showUrbanLocations"
									>
										{{ t("MapsPage.selection.show-urban-locations") }}
									</label>
								</div>
							</div>
							<div
								v-if="mappedColors && Object.values(mappedColors).length"
								class="col-span-1 space-y-1 text-sm font-semibold"
							>
								<p>{{ t("MapsPage.selection.colors") }}</p>
								<div class="flex flex-wrap gap-2">
									<ColorPicker
										v-for="(color, index) in Object.values(mappedColors)"
										:key="index"
										:model-value="Object.values(mappedColors)[index]"
										@update:model-value="handleColorUpdate(index, $event)"
									/>
								</div>
							</div>
						</div>
					</CollapsibleContent>
				</div>
				<div class="flex flex-col gap-2">
					<Button size="icon" variant="outline" @click="resetSelection()"
						><RotateCcwIcon class="size-4"
					/></Button>
					<CollapsibleTrigger
						><Button size="icon" variant="outline"
							><ChevronDownIcon
								class="size-4"
								:class="{ 'rotate-180': showAdvancedFilters }" /></Button
					></CollapsibleTrigger>
				</div>
			</div>
		</Collapsible>
		<VisualisationContainer
			v-slot="{ height, width }"
			class="border"
			:class="{ 'h-[600px]': !mapExpanded }"
			:fullscreen="mapExpanded"
		>
			<div
				v-if="filteredUniqueVariants.length"
				id="legend"
				class="absolute bottom-12 right-0 z-10 mr-2"
			>
				<div
					class="rounded-md border-2 border-transparent bg-background p-3 text-sm text-foreground shadow-md"
				>
					<ul class="space-y-0.5">
						<li
							v-for="variant in filteredUniqueVariants"
							:key="variant.anno"
							class="flex items-center gap-1"
						>
							<svg class="inline align-baseline" height="12" width="12">
								<circle
									cx="6"
									cy="6"
									:fill="mappedColors[variant.anno]"
									r="5"
									stroke="black"
									stroke-align="inner"
									stroke-width="1"
								/>
							</svg>
							<span
								:class="{
									italic: !Object.keys(specialOrder).includes(variant.anno),
								}"
								>{{ variant.anno }}</span
							>({{ variant.count }})
						</li>
					</ul>
				</div>
			</div>
			<div id="expand" class="absolute right-2 top-2 z-10">
				<Button
					aria-label="Fullscreen"
					size="icon"
					variant="outline"
					@click="mapExpanded = !mapExpanded"
					><component :is="mapExpanded ? Minimize2Icon : Maximize2Icon" class="size-4"
				/></Button>
			</div>
			<div
				v-if="filteredPoints?.length && numberOfInformants"
				id="datapoints"
				class="absolute bottom-12 left-0 z-10 ml-2"
			>
				<div
					class="rounded-md border-2 border-transparent bg-background p-3 text-sm text-foreground shadow-md"
				>
					<div class="mb-1 flex items-center gap-1">
						<MapPinIcon class="size-4" /> {{ t("MapsPage.map.datapoints") }}:
						{{ filteredPoints.length }}
					</div>
					<div class="flex items-center gap-1">
						<UserIcon class="size-4" />{{ t("MapsPage.map.informants") }}:
						{{ numberOfInformants }}
					</div>
				</div>
			</div>
			<GeoMap
				v-if="height && width"
				:basemap="activeBasemap"
				:capitals-only="showStateCapitals && !showUrbanLocations"
				:features="features"
				:geo-outline="geoOutline"
				:height="height"
				:locations="dataPoints"
				:show-region-names="showRegionNames"
				:show-regions="showRegions"
				:simplified-view="simplifiedView"
				:width="width"
				@layer-click="onLayerClick"
			>
				<GeoMapPopup
					v-if="popover !== null"
					:coordinates="popover.coordinates"
					@close="popover = null"
				>
					<article class="grid w-56 gap-1">
						<div v-for="entity in popover.entities" :key="entity.id">
							<p>
								<strong>{{ entity.place_name }}</strong
								>, {{ entity.plz }} ({{ getEntityTotal(entity) }})
							</p>
							<ul>
								<li v-for="(value, key) in getEntityOccurrences(entity)" :key="key">
									<details :name="key">
										<summary>
											<div class="inline-flex items-center gap-1 align-top">
												<svg height="12" width="12">
													<circle
														cx="6"
														cy="6"
														:fill="mappedColors[key]"
														r="5"
														stroke="black"
														stroke-width="1"
													/>
												</svg>
												<span
													:class="{
														italic: !Object.keys(specialOrder).includes(key),
													}"
												>
													{{ key }}</span
												>
												({{ value.total }})
											</div>
										</summary>
										<p v-for="(v, k) in value.varieties" :key="k" class="">
											- {{ sanititzeReg(k) }}: {{ v }}
										</p>
									</details>
								</li>
							</ul>
						</div>
					</article>
				</GeoMapPopup>
			</GeoMap>
		</VisualisationContainer>
		<div class="flex w-full gap-3">
			<p class="break-words rounded-md border p-2 text-sm text-foreground/70">{{ fullRoute }}</p>
			<CopyToClipboard :text="fullRoute" />
		</div>
		<DataTable v-if="tableData.length" :columns="columnsLocations" :data="tableData"></DataTable>
		<DataTable
			v-if="tableDataForRegisters.length"
			:columns="columnsRegisters"
			:data="tableDataForRegisters"
		></DataTable>
	</div>
</template>
