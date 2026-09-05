<script lang="ts" setup>
import "v-onboarding/dist/style.css";

import { keyByToMap } from "@acdh-oeaw/lib";
import {
	CircleHelp,
	Database,
	FileText,
	Image,
	InfoIcon,
	MapPinIcon,
	Maximize2Icon,
	Minimize2Icon,
	UserIcon,
} from "@lucide/vue";
import { refDebounced } from "@vueuse/core";
import type { MapGeoJSONFeature } from "maplibre-gl";
import { useRoute, useRouter } from "nuxt/app";
import type { LocationQueryValue, RouteLocationNormalizedLoaded } from "vue-router";

import austriaGeoBoundaries from "@/assets/data/austria-lexat21-optimized.geojson.json";
import dialectRegions from "@/assets/data/dialektregionen-lexat21-optimized.geojson.json";
import {
	basemapOptions,
	getRegisterOptions,
	regions,
	registerGroups,
	specialOrder,
	stateCapitalsList,
} from "@/assets/data/static-filter-data";
import type { TableColumn, TableEntry } from "@/components/data-table.vue";
import type StimulusDialog from "@/components/stimulus-dialog.vue";
import { useMapColors } from "@/composables/use-map-colors";
import { useQuestions } from "@/composables/use-questions";
import type { DropdownOption } from "@/types/dropdown-option";
import type {
	RegionFeature,
	SurveyResponse,
	SurveyResponseProperty,
} from "@/types/feature-collection";
import type { LocationOption } from "@/types/location-option";
import type { GeoJsonFeature } from "@/utils/create-geojson-feature";
import {
	countUniqueVariants,
	getSortedVariants,
	processUniqueVariants,
} from "@/utils/variant-helper";

import CopyToClipboard from "./copy-to-clipboard.vue";

const colorMode = useColorMode();
const t = useTranslations();
const router = useRouter();
const route = useRoute();
const env = useRuntimeConfig();
const localePath = useLocalePath();

const registerOptions = getRegisterOptions(t);

const popover = ref<{ coordinates: [number, number]; entities: Array<SurveyResponse> } | null>(
	null,
);
const onboardingWrapper = ref<{ startOnboarding: () => void } | null>(null);

const { colors, specialColors, resetColors } = useMapColors();

const { questions } = await useQuestions();

const mappedQuestions = computed(() => {
	return (
		questions.value?.map((q) => ({
			id: q.id,
			value: q.id.toString(),
			label: q.phenomenon_name ?? "n/A",
		})) ?? null
	);
});

const activeAgeGroup = ref([0, 100]);
const activeLocations = ref<Array<LocationOption>>([]);
const activeSurveyRounds = ref<Array<string>>(["1", "2"]);
const changedColors = ref<Record<string, string>>({});
const debouncedActiveAgeGroup = refDebounced(activeAgeGroup, 250);
const activeBasemap = ref<string>("https://basemaps.cartocdn.com/gl/positron-gl-style/style.json");
const activeQuestion = ref<{ id: number; value: string; label: string } | undefined>(undefined);
const activeRegisters = ref<Array<string>>(["all"]);
const activeVariants = ref<Array<string>>(["all"]);
const mapExpanded = ref<boolean>(false);
const simplifiedView = ref<boolean>(false);
const showRegionNames = ref<boolean>(false);
const showRegions = ref<boolean>(true);
const showStateCapitals = ref<boolean>(true);
const showUrbanLocations = ref<boolean>(true);
const open = ref(false);
const showVariantPercentages = ref<boolean>(true);
const highlightedRegion = ref<string>("");

const activeQuestionId = computed(() => {
	return activeQuestion.value?.id || undefined;
	// return mappedQuestions.value?.find((q) => q.value === activeQuestion.value)?.id;
});

const stimulusDialogRef = ref<InstanceType<typeof StimulusDialog> | null>(null);

function handleShowImage() {
	stimulusDialogRef.value?.openDialog();
}

const surveyRoundOptions = computed(() => {
	const hasSingleSelection = activeSurveyRounds.value.length === 1;

	return [
		{
			value: "1",
			label: t("MapsPage.selection.survey.options.one"),
			disabled: hasSingleSelection && activeSurveyRounds.value.includes("1"),
		},
		{
			value: "2",
			label: t("MapsPage.selection.survey.options.two"),
			disabled: hasSingleSelection && activeSurveyRounds.value.includes("2"),
		},
	];
});

const updateActiveSurveyRounds = (selection: Array<string>) => {
	if (selection.length > 0) {
		activeSurveyRounds.value = selection;
	}
};

const { data: questionData } = await useFetch<Array<SurveyResponse>>("/questions", {
	query: { phenomenonId: activeQuestionId, projectId: "1", surveyIds: activeSurveyRounds },
	baseURL: env.public.apiBaseUrl,
	method: "get",
});

const entities = computed((): Array<RegionFeature> => {
	return dialectRegions.features;
});

const points = computed(() => {
	let features = questionData.value ?? [];

	features.forEach((f) => {
		if (Array.isArray(f.informants)) {
			// Filter out "Keine Angabe" answers in each coalesce entry
			f.informants.forEach((entry) => {
				entry.answers = entry.answers.filter(
					(answer) => answer.annotation.toLowerCase() !== "keine angabe",
				);
			});

			// Remove coalesce entries whose answers array is now empty
			f.informants = f.informants.filter((entry) => entry.answers.length > 0);
		}
		f.id = `${f.plz.toString()}-${f.place_name}`;
	});

	// only entries with coordinates are considered valid points
	// let filteredFeatures = features.filter((f) => f.geometry.coordinates);

	if (!activeRegisters.value.includes("all")) {
		const activeRegisterLabels: Array<string> = [];
		for (const register of activeRegisters.value) {
			const label = registerOptions.find((r) => r.value === register)?.label;
			if (label) activeRegisterLabels.push(label);
		}

		features = features
			.map((feature) => {
				const filteredProperties = feature.informants
					.map((property) => {
						const filteredAnswers = property.answers.filter((answer) =>
							activeRegisterLabels.includes(answer.variety),
						);
						return { ...property, answers: filteredAnswers };
					})
					.filter((property) => property.answers.length > 0);

				return { ...feature, informants: filteredProperties };
			})
			.filter((feature) => feature.informants.length > 0);
	}

	return features;
});

/**
 * Reduce size of geojson payload, which has an impact on performance, because `maplibre-gl` will
 * serialize geojson features when sending them to the webworker.
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
		// apply distinct colors for "irrelevant" and "sonstige"
		if (Object.keys(specialOrder).includes(u.anno)) {
			const specialColor = specialColors.value[u.anno];
			if (specialColor) {
				tempColors[i] = specialColor;
			}
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
	if (activeVariants.value.length && !activeVariants.value.includes("all")) {
		filteredPoints = filteredPoints
			.map((entry) => {
				const filteredCoalesce = entry.informants // Make sure this is referring to 'coalesce'
					.map((property) => {
						const filteredAnswers = property.answers.filter((answer) =>
							activeVariants.value.includes(answer.annotation),
						);
						return { ...property, answers: filteredAnswers };
					})
					.filter((property) => property.answers.length > 0);

				return { ...entry, informants: filteredCoalesce }; // Properly assign the filtered coalesce here
			})
			.filter((entry) => entry.informants.length > 0); // Filter out entries with no remaining coalesce properties
	}

	filteredPoints = filteredPoints
		.map((item) => {
			const filteredProperties = item.informants.filter((prop) => {
				const ageBounds = prop.age.split("-");
				return (
					parseInt(ageBounds[0]!) >= (debouncedActiveAgeGroup.value[0] ?? 0) &&
					parseInt(ageBounds[1]!) < (debouncedActiveAgeGroup.value[1] ?? 100)
				);
			});

			return {
				...item,
				informants: filteredProperties,
			};
		})
		.filter((item) => item.informants.length > 0);

	let visibleLocationPoints = structuredClone(filteredPoints);
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
	if (activeLocations.value.length) {
		const activeLocationLabels = activeLocations.value.map((a) => a.label);
		visibleLocationPoints = visibleLocationPoints.filter((p) =>
			activeLocationLabels.includes(p.place_name),
		);
	}
	return visibleLocationPoints;
});

// const dataPoints = computed(() => {
// 	const geoJsonPoints = filteredPoints.value.map((entity) => {
// 		return createGeoJsonFeature(entity, mappedColors.value);
// 	});

// 	return geoJsonPoints.sort((a, b) => b.properties.answerCount! - a.properties.answerCount!);
// });

const dataPoints = computed(() => {
	const visibleLocationPoints = structuredClone(filteredPoints.value);
	const geoJsonPoints = visibleLocationPoints.map((entity) => {
		return createGeoJsonFeature(entity, mappedColors.value);
	});

	return geoJsonPoints.toSorted((a, b) => b.properties.answerCount! - a.properties.answerCount!);
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

const filteredUniqueVariants = computed(() =>
	processUniqueVariants(filteredPoints.value, specialOrder),
);

const uniqueVariants = computed(() => {
	const countedUniqueVariants = countUniqueVariants(points.value);
	return getSortedVariants(countedUniqueVariants);
});

const uniqueVariantsOptions = computed<Array<{ label: string; value: string }>>(() => {
	const variantOptions = uniqueVariants.value
		.map((variant) => ({
			label: variant.anno,
			value: variant.anno,
		}))
		.toSorted((a, b) => {
			const priorityA = specialOrder[a.value] ?? 0;
			const priorityB = specialOrder[b.value] ?? 0;

			return priorityB - priorityA;
		});

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
		total: number; // sum of all variety counts for that annotation
		percentage?: string;
	}
>;

interface ProcessedItem {
	index: number;
	annotation: string;
	varieties: Record<string, number>;
	total: number;
	rawPercentage: number;
	floored: number;
	remainder: number;
	percentage?: string;
}

// TODO refactor with processUniqueVariants logic in mind
const countOccurrences = (properties: Array<SurveyResponseProperty>): OccurrenceCount => {
	const occurrenceCount = properties.reduce(
		(acc, prop) => {
			for (const { annotation, variety } of prop.answers) {
				acc[annotation] = acc[annotation] || {};
				acc[annotation][variety] = (acc[annotation][variety] || 0) + 1;
			}
			return acc;
		},
		{} as Record<string, Record<string, number>>,
	);

	const unsortedArray = Object.entries(occurrenceCount).map(([annotation, varieties]) => ({
		annotation,
		varieties,
		total: Object.values(varieties).reduce((sum, c) => sum + c, 0),
	}));

	unsortedArray.sort((a, b) => {
		const aOrder = specialOrder[a.annotation] ?? 0;
		const bOrder = specialOrder[b.annotation] ?? 0;
		// Higher specialOrder first
		if (aOrder !== bOrder) return bOrder - aOrder;
		// Then by total descending
		return b.total - a.total;
	});

	// If nothing in total, return empty
	const grandTotal = unsortedArray.reduce((sum, item) => sum + item.total, 0);
	if (grandTotal === 0) {
		return {};
	}

	// Largest-remainder method for integer percentages
	const processed: Array<ProcessedItem> = unsortedArray.map((item, index) => {
		const rawPercentage = (item.total / grandTotal) * 100;
		const floored = Math.floor(rawPercentage);
		return {
			...item,
			index,
			rawPercentage,
			floored,
			remainder: rawPercentage - floored,
		};
	});

	const totalFloored = processed.reduce((sum, p) => sum + p.floored, 0);
	let remainderToDistribute = 100 - totalFloored;

	processed.sort((a, b) => b.remainder - a.remainder);

	for (const item of processed) {
		if (remainderToDistribute <= 0) break;
		if (item.rawPercentage > 0) {
			item.floored++;
			remainderToDistribute--;
		}
	}

	processed.sort((a, b) => a.index - b.index);

	for (const item of processed) {
		// If raw is between 0 and 1, show "<1"
		if (item.rawPercentage > 0 && item.rawPercentage < 1) {
			item.percentage = "<1";
		} else {
			item.percentage = String(item.floored);
		}
	}

	const result: OccurrenceCount = {};
	for (const { annotation, varieties, total, percentage } of processed) {
		result[annotation] = { varieties, total, percentage: percentage! };
	}

	return result;
};

const getEntityOccurrences = (entity: SurveyResponse) => {
	return countOccurrences(entity.informants ?? []);
};

const getEntityTotal = (entity: SurveyResponse) => {
	const occurrences = getEntityOccurrences(entity);
	return Object.values(occurrences).reduce((sum, item) => sum + item.total, 0);
};

const numberOfInformants = computed(() => {
	return filteredPoints.value.reduce((count, obj) => {
		return count + obj.informants.length;
	}, 0);
});

const tableData = computed(() => {
	const result = [];
	const countMap: Record<string, TableEntry> = {};

	filteredPoints.value.forEach((feature) => {
		const location = feature.place_name;

		feature.informants.forEach((property) => {
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
		feature.informants.forEach((property) => {
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

const columnsLocations = ref<Array<TableColumn>>([
	{
		label: t("MapsPage.table.locations.location.header"),
		value: "location",
		sortable: true,
		footer: t("MapsPage.table.locations.location.footer"),
	},
	{ label: t("MapsPage.table.locations.variant"), value: "variant", sortable: true },
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
	const queryObject: LocationQueryRaw = {};
	Object.entries(route.query).forEach(([key, value]) => {
		if (!["a", "q", "r", "v", "c", "sv", "sr"].includes(key)) {
			queryObject[key] = value;
		}
	});
	if (activeSurveyRounds.value.length > 0) {
		queryObject.sr = activeSurveyRounds.value;
	}
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
		queryObject.v = activeVariants.value;
	}
	queryObject.sv = simplifiedView.value.toString();

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
		activeAgeGroup.value = [0, 100];
	}
	if (!omit?.includes("question")) {
		activeQuestion.value = "";
	}
	if (!omit?.includes("register")) {
		activeRegisters.value = ["all"];
	}
	activeVariants.value = ["all"];
	activeLocations.value = [];
	popover.value = null;
	changedColors.value = {};
	activeSurveyRounds.value = ["1", "2"];
	await updateUrlParams();
};

const fallbackQuestion = {
	id: 11,
	value: "11",
	label: "AUGENLID",
};

const initializeFromUrl = () => {
	// flag to track if we generated local state
	let requiresUrlUpdate = false;

	const ageParams = getQueryArray(route, "a");
	if (ageParams.length > 0 && ageParams[0]) {
		activeAgeGroup.value = ageParams[0].split(",").map(Number);
	}

	const questionParam = route.query.q;
	if (typeof questionParam === "string" && questionParam !== "") {
		activeQuestion.value =
			mappedQuestions.value?.find((m) => m.value === questionParam) ?? fallbackQuestion;
	} else if (mappedQuestions.value && mappedQuestions.value.length > 0) {
		// Pick a random question if none is specified in the URL
		const randomIndex = Math.floor(Math.random() * mappedQuestions.value.length);
		const randomQuestion = mappedQuestions.value.find((m) => m.id === randomIndex);

		if (randomQuestion) {
			activeQuestion.value = randomQuestion;
			requiresUrlUpdate = true; // flag that we need to sync this new random state to the URL
		}
	}

	const surveyParams = getQueryArray(route, "sr");
	if (surveyParams.length > 0) {
		const params = surveyParams.map(String);
		activeSurveyRounds.value = params;
	} else {
		activeSurveyRounds.value = ["1", "2"];
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
		simplifiedView.value = simplifiedViewParam !== "false";
	}

	const colorParams = getQueryArray(route, "c");
	if (colorParams.length > 0) {
		colorParams.forEach((entry) => {
			if (entry) {
				// split string into index, hexcode and optional key for special colors
				const [index, hexCode, key] = entry.split("-");
				if (index && hexCode) {
					if (key === "i") {
						specialColors.value.irrelevant = hexCode;
					} else if (key === "s") {
						specialColors.value.sonstige = hexCode;
					} else {
						colors.value[Number(index)] = hexCode;
					}
					changedColors.value[index] = `${index}-${hexCode}${key ? `-${key}` : ""}`;
				}
			}
		});
	}

	// sync the URL once all other params have been safely parsed
	if (requiresUrlUpdate) {
		void updateUrlParams();
	}
};

const setAgeGroup = (newValues: Array<number>) => {
	activeAgeGroup.value = newValues;
};

const handleColorUpdate = (index: number, newColor: string) => {
	let key = Object.keys(mappedColors.value)[index];
	if (key === "irrelevant") {
		specialColors.value.irrelevant = newColor;
		key = "i";
	} else if (key === "sonstige") {
		specialColors.value.sonstige = newColor;
		key = "s";
	} else {
		colors.value[index] = newColor;
		key = undefined;
	}
	// keep track of every color change to save them in url params
	changedColors.value[index] = `${index}-${newColor}${key ? `-${key}` : ""}`;
	updateUrlParams();
};

const capitalsOnly = computed(() => Boolean(showStateCapitals.value && !showUrbanLocations.value));

const postAlias = computed(() => {
	return questions.value?.find((q) => q.id === activeQuestionId.value)?.post_alias;
});

initializeFromUrl();

const highlightRegion = (regionName: string) => {
	highlightedRegion.value = regionName;
};

const goToArticlePage = async (): Promise<void> => {
	if (postAlias.value) {
		window.open(postAlias.value, "_blank");
	}
};

const goToDbPage = async (): Promise<void> => {
	await navigateTo({
		path: localePath("/db"),
		query: route.query,
	});
};

// ONBOARDING
const steps = [
	{
		attachTo: { element: "#welcome" },
		content: {
			title: "Onboarding.Map-Onboarding.welcome.title",
			description: "Onboarding.Map-Onboarding.welcome.description",
		},
	},
	{
		attachTo: { element: "#phenomenon" },
		content: {
			title: "Onboarding.Map-Onboarding.phenomenon.title",
			description: "Onboarding.Map-Onboarding.phenomenon.description",
		},
	},
	{
		attachTo: { element: "#register" },
		content: {
			title: "Onboarding.Map-Onboarding.register.title",
			description: "Onboarding.Map-Onboarding.register.description",
		},
	},
	{
		attachTo: { element: "#reset" },
		content: {
			title: "Onboarding.Map-Onboarding.reset.title",
			description: "Onboarding.Map-Onboarding.reset.description",
		},
	},
	{
		attachTo: { element: "#advanced" },
		content: {
			title: "Onboarding.Map-Onboarding.advanced.title",
			description: "Onboarding.Map-Onboarding.advanced.description",
		},
	},
	{
		attachTo: { element: "#about" },
		content: {
			title: "Onboarding.Map-Onboarding.about.title",
			description: "Onboarding.Map-Onboarding.about.description",
		},
	},
];

const activeLocationOptions = computed(() => {
	return Array.from(new Set(points.value.map((point) => point.place_name)))
		.toSorted((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }))
		.map((location) => ({ value: location, label: location }));
});

const onOnboardingFinished = () => {
	const timestamp = new Date().toISOString();
	localStorage.setItem("map-onboarding", JSON.stringify({ finishedAt: timestamp }));
};

onMounted(() => {
	const onboardingData = localStorage.getItem("map-onboarding");

	if (!onboardingData) {
		onboardingWrapper.value?.startOnboarding();
	} else {
		const { finishedAt } = JSON.parse(onboardingData);
		// eslint-disable-next-line no-console
		console.info("Onboarding completed at:", finishedAt);
	}
});

const resetOnboarding = () => {
	localStorage.removeItem("map-onboarding");
	onboardingWrapper.value?.startOnboarding();
};

watch(activeQuestion, async () => {
	await resetSelection(["question"]);
	resetColors();
});

watch(
	activeSurveyRounds,
	async () => {
		popover.value = null;
		await updateUrlParams();
	},
	{ deep: true },
);

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
		<div id="welcome">
			<div class="flex gap-2">
				<div class="grow rounded-lg border border-muted p-5">
					<div class="grid grid-cols-4 gap-5">
						<div id="phenomenon">
							<div class="mb-1 ml-1 flex gap-1 text-sm font-semibold">
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
								v-if="mappedQuestions?.length"
								v-model="activeQuestion"
								data-testid="questions"
								:items="mappedQuestions"
								size="lg"
								:placeholder="t('MapsPage.selection.variable.placeholder')"
								class="w-64"
							/>
						</div>
						<div id="register">
							<div class="mb-1 ml-1 flex gap-1 text-sm font-semibold">
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
								data-testid="registers"
								:options="registerOptions"
								:placeholder="t('MapsPage.selection.register.placeholder')"
							/>
						</div>
						<div id="variant">
							<div class="mb-1 ml-1 flex gap-1 text-sm font-semibold">
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
								:model-value="activeVariants"
								multiple
								size="lg"
								:items="uniqueVariantsOptions"
								:placeholder="t('MapsPage.selection.variants.placeholder')"
								class="w-62"
								@update:model-value="updateActiveVariants"
							/>
						</div>
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
					<UCollapsible v-model:open="open">
						<template #content>
							<hr class="mt-5 border-muted" />
							<div class="mt-4 grid grid-cols-4 gap-5">
								<div>
									<div class="mb-1 ml-1 text-sm font-semibold">
										{{ t("MapsPage.selection.basemap.title") }}
									</div>
									<USelect
										v-model="activeBasemap"
										:items="basemapOptions"
										:placeholder="t('MapsPage.selection.basemap.placeholder')"
										size="lg"
										class="w-64"
									/>
									<div class="mt-2 mb-1 ml-1 text-sm font-semibold">
										{{ t("MapsPage.selection.survey.title") }}
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
								<div class="">
									<div class="mb-1 ml-1 text-sm font-semibold">
										{{ t("MapsPage.selection.display-options") }}
									</div>
									<div class="mb-2 flex w-64 space-x-2 self-center rounded border border-muted p-2">
										<UCheckbox id="showData" v-model="simplifiedView" />
										<label
											class="flex items-center gap-1 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
											for="showData"
										>
											{{ t("MapsPage.selection.simplified-view.label") }}
											<UTooltip
												:content="{ side: 'top' }"
												:delay-duration="0"
												arrow
												:text="t('MapsPage.selection.simplified-view.tooltip')"
											>
												<UIcon name="i-lucide-info" class="size-4" />
											</UTooltip>
										</label>
									</div>
									<div class="flex w-64 space-x-2 self-center rounded border border-muted p-2">
										<UCheckbox id="showRegions" v-model="showRegions" />
										<label
											class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
											for="showRegions"
										>
											{{ t("MapsPage.selection.show-regions") }}
										</label>
									</div>
								</div>
								<div class="">
									<label class="mb-1 ml-1 block text-sm font-semibold" for="location-filter">
										{{ t("MapsPage.selection.filter-locations") }}
									</label>
									<div class="mb-2 flex w-64 space-x-2 self-center rounded border border-muted p-2">
										<UCheckbox id="showStateCapitals" v-model="showStateCapitals" />
										<label
											class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
											for="showStateCapitals"
										>
											{{ t("MapsPage.selection.show-state-capitals") }}
										</label>
									</div>
									<div class="mb-2 flex w-64 space-x-2 self-center rounded border border-muted p-2">
										<UCheckbox id="showUrbanLocations" v-model="showUrbanLocations" />
										<label
											class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
											for="showUrbanLocations"
										>
											{{ t("MapsPage.selection.show-urban-locations") }}
										</label>
									</div>
									<LocationSearch
										v-if="filteredPoints?.length"
										id="location-filter"
										v-model="activeLocations"
										:options="activeLocationOptions"
										:placeholder="t('MapsPage.selection.locations')"
									/>
								</div>
								<div
									v-if="mappedColors && Object.values(mappedColors).length"
									class="col-span-1 text-sm font-semibold"
								>
									<div class="mb-1 ml-1 text-sm font-semibold">
										{{ t("MapsPage.selection.legend") }}
									</div>

									<div class="mb-2 flex w-64 space-x-2 self-center rounded border border-muted p-2">
										<UCheckbox id="showVariantPercentages" v-model="showVariantPercentages" />
										<label
											class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
											for="showVariantPercentages"
										>
											{{ t("MapsPage.selection.show-variant-percentages") }}
										</label>
									</div>
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
			</div>
		</div>
		<VisualisationContainer
			v-slot="{ height, width }"
			class="border border-muted"
			:class="{ 'h-[600px]': !mapExpanded }"
			:fullscreen="mapExpanded"
		>
			<div
				v-if="filteredUniqueVariants.length"
				id="variantLegend"
				class="absolute bottom-12 right-0 z-10 mr-2"
				data-testid="variantLegend"
			>
				<UCard variant="outline" class="text-sm shadow-md" :ui="{ body: 'p-3 sm:p-3' }">
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
									:stroke="colorMode.value === 'dark' ? 'white' : 'black'"
									stroke-align="inner"
									stroke-width="1"
								/>
							</svg>
							<span
								:class="{
									italic: !Object.keys(specialOrder).includes(variant.anno),
								}"
								>{{ variant.anno }}</span
							>({{ showVariantPercentages ? `${variant.percentage}%` : variant.count }})
						</li>
					</ul>
				</UCard>
			</div>
			<div
				v-if="features.length"
				id="regionLegend"
				class="absolute bottom-2 left-28 z-10 mr-2"
				data-testid="regionLegend"
			>
				<UCard
					variant="outline"
					class="text-sm shadow-md"
					:ui="{ body: 'px-2 py-0.5 sm:px-2 sm:py-0.5' }"
				>
					<ul class="gap-3 flex">
						<li
							v-for="region in regions.map((r) => ({ ...r, name: t(`Regions.${r.name}`) }))"
							:key="region.id"
							class="flex items-center gap-1 cursor-default hover:underline"
							role="button"
							tabindex="0"
							@blur="highlightRegion('')"
							@focus="highlightRegion(region.name)"
							@mouseout="highlightRegion('')"
							@mouseover="highlightRegion(region.name)"
						>
							<svg class="inline align-baseline" height="12" width="12">
								<circle
									cx="6"
									cy="6"
									:fill="region.color"
									r="5"
									:stroke="colorMode.value === 'dark' ? 'white' : 'black'"
									stroke-align="inner"
									stroke-width="1"
								/>
							</svg>
							<span class="italic">{{ region.name }}</span>
						</li>
					</ul>
				</UCard>
			</div>
			<div id="expand" class="absolute right-2 top-2 z-10">
				<UButton
					aria-label="Fullscreen"
					size="xl"
					variant="outline"
					color="neutral"
					:icon="!mapExpanded ? 'i-lucide-fullscreen' : 'i-lucide-minimize-2'"
					@click="mapExpanded = !mapExpanded"
				/>
			</div>
			<div v-if="stimulusDialogRef?.hasImage" class="absolute top-14 right-2 z-10">
				<UButton
					size="lg"
					:title="t('MapsPage.show-stimulus')"
					variant="outline"
					@click="handleShowImage"
				>
					<UIcon name="i-lucide-image" class="size-5" />
					<span class="sr-only">Show Phenomenon Image</span>
				</UButton>
			</div>
			<div
				v-if="filteredPoints?.length && numberOfInformants"
				id="dataLegend"
				class="absolute bottom-12 left-0 z-10 ml-2"
				data-testid="dataLegend"
			>
				<UCard variant="outline" class="text-sm shadow-md" :ui="{ body: 'p-3 sm:p-3' }">
					<div class="mb-1 flex items-center gap-1" data-testid="datapoints">
						<UIcon name="i-lucide-map-pin" class="size-4" /> {{ t("MapsPage.map.datapoints") }}:
						{{ filteredPoints.length }}
					</div>
					<div class="flex items-center gap-1" data-testid="informants">
						<UIcon name="i-lucide-user" class="size-4" />{{ t("MapsPage.map.informants") }}:
						{{ numberOfInformants }}
					</div>
				</UCard>
			</div>
			<GeoMap
				v-if="height && width"
				:basemap="activeBasemap"
				:capitals-only="capitalsOnly"
				:features="features"
				:geo-outline="geoOutline"
				:height="height"
				:highlighted-region="highlightedRegion"
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
					<article class="grid w-58 gap-1">
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
												({{ showVariantPercentages ? `${value.percentage}%` : value.total }})
											</div>
										</summary>
										<p v-for="(v, k) in value.varieties" :key="k" class="">- {{ k }}: {{ v }}</p>
									</details>
								</li>
							</ul>
						</div>
					</article>
				</GeoMapPopup>
			</GeoMap>
		</VisualisationContainer>
		<div class="flex w-full items-start justify-between gap-8">
			<div class="flex min-w-0 flex-1 items-start gap-3">
				<p
					class="min-w-0 flex-1 break-all rounded-md border border-muted p-2 text-sm text-foreground/70"
					data-testid="clipboard-url"
				>
					{{ fullRoute }}
				</p>
				<div class="shrink-0">
					<CopyToClipboard :text="fullRoute" />
				</div>
			</div>
			<div class="flex shrink-0 gap-3">
				<UButton
					v-if="postAlias"
					data-testid="goToArticlePage"
					icon="i-lucide-file-text"
					size="lg"
					@click="goToArticlePage"
					>{{ t("MapsPage.go-to-article") }}</UButton
				>
				<UButton
					v-if="activeQuestionId"
					data-testid="goToDbPage"
					icon="i-lucide-database"
					size="lg"
					@click="goToDbPage"
					>{{ t("MapsPage.go-to-db") }}</UButton
				>
				<UButton
					v-else
					data-testid="resetOnboarding"
					variant="outline"
					icon="i-lucide-circle-help"
					size="lg"
					@click="resetOnboarding"
				>
					{{ t("MapsPage.help") }}</UButton
				>
			</div>
		</div>
		<DataTable
			v-if="tableData.length"
			:columns="columnsLocations"
			:data="tableData"
			data-testid="locationTable"
		></DataTable>
		<DataTable
			v-if="tableDataForRegisters.length"
			:columns="columnsRegisters"
			:data="tableDataForRegisters"
			data-testid="variantTable"
		></DataTable>
		<OnboardingWrapper
			ref="onboardingWrapper"
			:steps="steps"
			@finished-onboarding="onOnboardingFinished"
		>
		</OnboardingWrapper>
	</div>
	<!-- <StimulusDialog ref="stimulusDialogRef" :phenomenon-id="activeQuestionId" /> -->
</template>
