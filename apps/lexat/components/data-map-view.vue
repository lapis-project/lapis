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
import type {
	Property,
	RegionFeature,
	SurveyCollection,
	SurveyResponse,
} from "@/types/feature-collection";
// import { z } from "zod";
// import type { SearchFormData } from "@/components/search-form.vue";
// import type { EntityFeature } from "@/composables/use-create-entity";
// import { categories } from "@/composables/use-get-search-results";
// import { project } from "@/config/project.config";
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

export interface DropdownOption {
	value: string;
	label: string;
	level?: number;
	group?: string;
}

const questions: Array<DropdownOption> = [
	{ value: "augenlid", label: "Augenlid" },
	{ value: "auswringen", label: "Auswringen" },
	{ value: "backenzahn", label: "Backenzahn" },
	{ value: "barfuss", label: "Barfuß" },
	{ value: "bauchschmerzen", label: "Bauchschmerzen" },
	{ value: "begraebnis", label: "Begräbnis" },
	{ value: "brombeere", label: "Brombeere" },
	{ value: "eidotter", label: "Eidotter" },
	{ value: "walderdbeere", label: "Walderdbeere" },
	{ value: "kehren", label: "Kehren" },
	{ value: "ferkel", label: "Ferkel" },
	{ value: "fruehling", label: "Frühling" },
	{ value: "giesskanne", label: "Gießkanne" },
	{ value: "oma", label: "Oma" },
	{ value: "opa", label: "Opa" },
	{ value: "gurke", label: "Gurke" },
	// { value: "hagebutte", label: "Hagebutte" },
	// { value: "himbeere", label: "Himbeere"},
	// { value: "knoechel", label: "Knöchel" },
	// { value: "kopfschmerzen", label: "Kopfschmerzen" },
	{ value: "streichholz", label: "Streichholz" },
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

const { data: questionData } = await useFetch<SurveyCollection>("/api/questions", {
	params: { question: activeQuestion },
	method: "get",
});

const specialOrder = {
	"keine Angabe": -3, // -3 indicates last key
	Sonstiges: -2,
	Sonstige: -1,
};

// const { counts } = useCountOccurrences(popover.value, specialOrder)

const entities = computed((): Array<RegionFeature> => {
	return data.features;
});

const points = computed(() => {
	const currentData = questionData.value;
	let features = currentData?.features ?? [];
	// only entries with coordinates are considered valid points
	// let filteredFeatures = features.filter((f) => f.geometry.coordinates);
	if (!activeRegisters.value.includes("all")) {
		let activeRegisterLabels: Array<string> = [];
		for (const register of activeRegisters.value) {
			const label = registerOptions.find((r) => r.value === register)?.label;
			if (label) {
				activeRegisterLabels.push(label);
			}
		}
		features = features
			.map((feature) => {
				const filteredProperties = feature.properties
					.map((property) => {
						const filteredAnswers = property.answers.filter((answer) =>
							activeRegisterLabels.includes(answer.reg),
						);
						return { ...property, answers: filteredAnswers };
					})
					.filter((property) => property.answers.length > 0);

				return { ...feature, properties: filteredProperties };
			})
			.filter((feature) => feature.properties.length > 0);
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
	let colorMap: Record<string, string> = {};
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
				const filteredProperties = entry.properties
					.map((property) => {
						const filteredAnswers = property.answers.filter((answer) =>
							activeVariants.value.includes(answer.anno),
						);
						return { ...property, answers: filteredAnswers };
					})
					.filter((property) => property.answers.length > 0);

				return { ...entry, properties: filteredProperties };
			})
			.filter((entry) => entry.properties.length > 0);
	}
	const currentYear = new Date().getFullYear();
	filteredPoints = filteredPoints
		.map((item) => {
			const filteredProperties = item.properties.filter((prop) => {
				const age = currentYear - parseInt(prop.age);
				return (
					age >= (debouncedActiveAgeGroup.value[0] ?? 10) &&
					age <= (debouncedActiveAgeGroup.value[1] ?? 100)
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

	// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
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
		coordinates = entity.geometry.coordinates;
	}
	if (coordinates) {
		popover.value = {
			coordinates: coordinates as [number, number],
			entities,
		};
	}
}

type OccurrenceCount = Record<string, Record<string, number>>;

const countOccurrences = (properties: Array<Property>) => {
	const counts: OccurrenceCount = {};
	for (const property of properties) {
		for (const answer of property.answers) {
			const { anno, reg } = answer;
			if (!counts[anno]) {
				counts[anno] = {};
			}
			if (!counts[anno][reg]) {
				counts[anno][reg] = 0;
			}
			counts[anno][reg]++;
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
		const location = feature.location;

		feature.properties.forEach((property) => {
			property.answers.forEach((answer) => {
				const reg = answer.reg;
				const anno = answer.anno;

				const key = `${location}-${reg}-${anno}`;

				if (!countMap[key]) {
					countMap[key] = {
						location: location,
						variant: anno,
						count: 0,
						register: reg,
					};
				}
				// eslint-disable-next-line @typescript-eslint/restrict-plus-operands
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
		feature.properties.forEach((property) => {
			property.answers.forEach((answer) => {
				const variant = answer.anno;
				if (!variantMap[variant]) {
					variantMap[variant] = {
						variant,
						countDia: 0,
						countSt: 0,
						totalCount: 0,
					};
				}
				if (registerGroups[0]?.values.includes(answer.reg)) {
					variantMap[variant].countDia++;
				}
				if (registerGroups[1]?.values.includes(answer.reg)) {
					variantMap[variant].countSt++;
				}
				// eslint-disable-next-line @typescript-eslint/restrict-plus-operands
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
								v-model="activeQuestion"
								:options="questions"
								:placeholder="t('MapsPage.selection.variable.placeholder')"
								has-search
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
							<DualRangeSlider
								:label="(value) => value"
								:value="activeAgeGroup"
								:min="10"
								:max="100"
								step="5"
								accessibility-label="Age Group"
								@update:value="setAgeGroup"
							/>
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
									:options="basemapOptions"
									:placeholder="t('MapsPage.selection.basemap.placeholder')"
									has-search
								/>
							</div>
							<div class="">
								<div class="mb-1 ml-1 text-sm font-semibold">Anzeigeoptionen</div>
								<div class="mb-2 flex w-64 space-x-2 self-center rounded border p-2">
									<Checkbox id="showData" v-model:checked="showAllPoints" />
									<label
										for="showData"
										class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
									>
										{{ t("MapsPage.selection.show-all-points") }}
									</label>
								</div>
								<div class="mb-2 flex w-64 space-x-2 self-center rounded border p-2">
									<Checkbox id="showRegionNames" v-model:checked="showRegionNames" />
									<label
										for="showRegionNames"
										class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
									>
										{{ t("MapsPage.selection.show-region-names") }}
									</label>
								</div>
								<div class="flex w-64 space-x-2 self-center rounded border p-2">
									<Checkbox id="showRegions" v-model:checked="showRegions" />
									<label
										for="showRegions"
										class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
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
					<Button variant="outline" size="icon" @click="resetSelection()"
						><RotateCcwIcon class="size-4"
					/></Button>
					<CollapsibleTrigger
						><Button variant="outline" size="icon"
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
								'italic-custom': !Object.keys(specialOrder).includes(variant.anno),
							}"
						>
							<svg width="12" height="12" class="inline align-baseline">
								<circle cx="6" cy="6" r="6" :fill="mappedColors[variant.anno]" />
							</svg>
							{{ variant.anno }}
						</li>
					</ul>
				</div>
			</div>
			<div id="expand" class="absolute right-2 top-2 z-10">
				<Button
					variant="outline"
					size="icon"
					aria-label="Fullscreen"
					@click="mapExpanded = !mapExpanded"
					><component :is="mapExpanded ? Minimize2Icon : Maximize2Icon" class="size-4"
				/></Button>
			</div>
			<GeoMap
				v-if="height && width"
				:features="features"
				:points="dataPoints"
				:height="height"
				:width="width"
				:show-all-points="showAllPoints"
				:show-region-names="showRegionNames"
				:show-regions="showRegions"
				:basemap="activeBasemap"
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
								<strong>{{ entity.location }}</strong
								>, {{ entity.PLZ }}
							</p>
							<ul>
								<li v-for="(value, key) in countOccurrences(entity.properties)" :key="key">
									<details>
										<summary>
											<svg width="12" height="12" class="mr-0.5 inline align-text-top">
												<circle cx="6" cy="6" r="6" :fill="mappedColors[key]" />
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

			<!-- <Centered voading" class="pointer-events-none">
				<LoadingIndicator class="text-neutral-950" size="lg" />
			</Centered> -->
		</VisualisationContainer>
		<CopyToClipboard :text="fullRoute" />
		<DataTable v-if="tableData.length" :data="tableData" :columns="columnsLocations"></DataTable>
		<DataTable
			v-if="tableDataForRegisters.length"
			:data="tableDataForRegisters"
			:columns="columnsRegisters"
		></DataTable>
	</div>
</template>
