<script lang="ts" setup>
import { keyByToMap } from "@acdh-oeaw/lib";
import { refDebounced } from "@vueuse/core";
import {
	ChevronDownIcon,
	InfoIcon,
	Maximize2Icon,
	Minimize2Icon,
	RotateCcwIcon,
} from "lucide-vue-next";
import type { MapGeoJSONFeature } from "maplibre-gl";
import { useRoute, useRouter } from "nuxt/app";

import data from "@/assets/data/dialektregionen-trimmed.geojson.json";
import type { TableColumn, TableEntry } from "@/components/data-table.vue";
import type { DropdownOption } from "@/types/dropdown-option";
import type { Coalesce, RegionFeature, SurveyResponse } from "@/types/feature-collection";
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

const colors = ref([
	"#ff8080",
	"#80ffa5",
	"#ca80ff",
	"#ffef80",
	"#80eaff",
	"#ff80c4",
	"#9fff80",
	"#8580ff",
	"#ffaa80",
	"#80ffcf",
	"#f580ff",
	"#e4ff80",
	"#80bfff",
	"#ff809a",
	"#80ff8a",
	"#b080ff",
]);

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
		label: "standardnahe Register",
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
		label: "bestes Hochdeutsch",
		value: "bhd",
		level: 2,
		group: "st",
	},
	{
		label: "standardferne Register",
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
		values: ["Ihr Hochdeutsch", "bestes Hochdeutsch", "Ihr österreichisches Hochdeutsch"],
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
const debouncedActiveAgeGroup = refDebounced(activeAgeGroup, 250);
const activeBasemap = ref<string>("https://basemaps.cartocdn.com/gl/positron-gl-style/style.json");
const activeQuestion = ref<string | null>(null);
const activeRegisters = ref<Array<string>>(["all"]);
const activeVariants = ref<Array<string>>([]);
const mapExpanded = ref<boolean>(false);
const showAllPoints = ref<boolean>(false);
const showRegionNames = ref<boolean>(false);
const showRegions = ref<boolean>(true);
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
	"keine Angabe": -4, // -4 indicates key to be sorted last
	Irrelevant: -3,
	Sonstiges: -2,
	Sonstige: -1,
};

const entities = computed((): Array<RegionFeature> => {
	return data.features;
});

const points = computed(() => {
	let features = questionData.value ?? [];
	features.forEach((f) => {
		if (Array.isArray(f.coalesce)) {
			f.coalesce.forEach((entry) => {
				// Filter the answers array to remove answers with annotation "Keine Angabe"
				entry.answers = entry.answers.filter((answer) => answer.annotation !== "Keine Angabe");
			});
		}
		f.id = `${f.plz.toString()}-${f.place_name}`;
	});

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

const mappedColors = computed(() => {
	const colorMap: Record<string, string> = {};
	uniqueVariants.value.forEach((u, i) => {
		const color = colors.value[i];
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
				properties: filteredProperties,
			};
		})
		.filter((item) => item.properties.length > 0);

	return filteredPoints;
});

const dataPoints = computed(() => {
	const geoJsonPoints = filteredPoints.value.map((entity) => {
		return createGeoJsonFeature(entity, mappedColors.value);
	});

	return geoJsonPoints.sort((a, b) => b.properties.answerCount! - a.properties.answerCount!);
});

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
	return uniqueVariants.value.map((variant) => ({
		label: variant.anno,
		value: variant.anno,
		level: 1,
		group: variant.anno.toLocaleLowerCase(),
	}));
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

type OccurrenceCount = Record<string, Record<string, number>>;

const countOccurrences = (properties: Array<Coalesce>) => {
	const counts: OccurrenceCount = {};
	for (const property of properties) {
		for (const answer of property.answers) {
			const { annotation, variety } = answer;
			if (!counts[annotation]) {
				counts[annotation] = {};
			}
			if (!counts[annotation][variety]) {
				counts[annotation][variety] = 0;
			}
			counts[annotation][variety]++;
		}
	}

	const sortedCounts: OccurrenceCount = {};

	Object.keys(counts)
		.sort((a, b) => {
			const orderA = specialOrder[a] ?? 0;
			const orderB = specialOrder[b] ?? 0;
			return orderB || a.localeCompare(b) - orderA;
		})
		.forEach((key) => {
			sortedCounts[key] = counts[key];
		});

	return sortedCounts;
};

// watch(data2, () => {
// 	/**
// 	 * Close popover when search results change, to avoid displaying popup for features which are
// 	 * no longer in the search results set.
// 	 */
// 	popover.value = null;
// });

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

const updateUrlParams = async () => {
	await router.replace({
		query: {
			...route.query,
			ageGroup: activeAgeGroup.value.join(","),
			question: activeQuestion.value,
			registers: activeRegisters.value.join(","),
			variants: activeVariants.value.join(","),
		},
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
	await updateUrlParams();
};

// Function to initialize states from URL parameters
const initializeFromUrl = () => {
	const { ageGroup, question, registers, variants } = route.query;

	if (ageGroup) activeAgeGroup.value = String(ageGroup).split(",").map(Number);
	if (question) activeQuestion.value = String(question);
	if (registers) activeRegisters.value = String(registers).split(",");
	if (variants) activeVariants.value = String(variants).split(",");
};

const setAgeGroup = (newValues: Array<number>) => {
	activeAgeGroup.value = newValues;
};

// Call the initialize function on component mount
initializeFromUrl();

watch(activeQuestion, async () => {
	await resetSelection(["question"]);
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
									<Checkbox id="showData" v-model:checked="showAllPoints" />
									<label
										class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
										for="showData"
									>
										{{ t("MapsPage.selection.show-all-points") }}
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
							<div
								v-if="mappedColors && Object.values(mappedColors).length"
								class="col-span-2 space-y-1 text-sm font-semibold"
							>
								<p>{{ t("MapsPage.selection.colors") }}</p>
								<div class="flex gap-2">
									<ColorPicker
										v-for="(color, index) in Object.values(mappedColors)"
										:key="index"
										v-model="colors[index]"
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
					<ul class="space-y-1">
						<li
							v-for="variant in filteredUniqueVariants"
							:key="variant.anno"
							:class="{
								italic: !Object.keys(specialOrder).includes(variant.anno),
							}"
						>
							<svg class="inline align-baseline" height="12" width="12">
								<circle cx="6" cy="6" :fill="mappedColors[variant.anno]" r="6" />
							</svg>
							{{ variant.anno }}
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
			<GeoMap
				v-if="height && width"
				:basemap="activeBasemap"
				:features="features"
				:height="height"
				:points="dataPoints"
				:show-all-points="showAllPoints"
				:show-region-names="showRegionNames"
				:show-regions="showRegions"
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
								>, {{ entity.plz }}
							</p>
							<ul>
								<li v-for="(value, key) in countOccurrences(entity.properties)" :key="key">
									<details :name="value">
										<summary>
											<svg class="mr-0.5 inline align-text-top" height="12" width="12">
												<circle cx="6" cy="6" :fill="mappedColors[key]" r="6" />
											</svg>
											{{ key }}
										</summary>
										<p v-for="(v, k) in value" :key="k" class="">
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
