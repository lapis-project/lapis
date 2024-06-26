<script lang="ts" setup>
import { keyByToMap } from "@acdh-oeaw/lib";
import { InformationCircleIcon } from "@heroicons/vue/20/solid";
import type { MapGeoJSONFeature } from "maplibre-gl";

import data from "@/assets/data/dialektregionen.geojson.json";
import * as fr1 from "@/assets/data/fr1.json";
import * as fr2 from "@/assets/data/fr2.json";
import * as fr41 from "@/assets/data/fr41.json";
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

const t = useTranslations();

const popover = ref<{ coordinates: Array<number>; entities: Array<SurveyResponse> } | null>(null);

const colors = [
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
];

export interface DropdownOption {
	value: string;
	label: string;
	data?: SurveyCollection;
}

const questions: Array<DropdownOption> = [
	{ value: "augenlid", label: "Augenlid", data: fr1 },
	{ value: "auswringen", label: "Auswringen", data: fr2 },
	{ value: "streichholz", label: "Streichholz", data: fr41 },
];

const registerDescriptions: Array<DropdownOption> = [
	{
		label: t("MapsPage.selection.register-definition.show-all"),
		value: "all",
	},
	{
		label: "Dialekt (Mundart)",
		value: "dia",
	},
	{
		label: "Ihr Hochdeutsch",
		value: "hd",
	},
	{
		label: "Ihr österreichisches Hochdeutsch",
		value: "oehd",
	},
	{
		label: "bestes Hochdeutsch",
		value: "bhd",
	},
	{
		label: "Umgangssprache oder Alltagssprache",
		value: "usas",
	},
];

const registerCategories: Array<DropdownOption> = [
	{
		label: t("MapsPage.selection.register-categories.show-all"),
		value: "all",
	},
	{
		label: "standardferne Register",
		value: "dia",
	},
	{
		label: "standardnahe Register",
		value: "st",
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

const activeQuestion = ref<string>("");
const activeRegisterDescription = ref<string>("all");
const activeRegister = ref<string>("all");
const activeTags = ref<Array<string>>([]);
const showAllPoints = ref<boolean>(false);
const showRegions = ref<boolean>(true);

const entities = computed((): Array<RegionFeature> => {
	return data.features;
});

const points = computed(() => {
	const currentData = questions.find((q) => q.value === activeQuestion.value)?.data;
	let features = currentData?.features ?? [];
	// only entries with coordinates are considered valid points
	// let filteredFeatures = features.filter((f) => f.geometry.coordinates);
	if (activeRegisterDescription.value && activeRegisterDescription.value !== "all") {
		const register = registerDescriptions.find(
			(r) => r.value === activeRegisterDescription.value,
		)?.label;
		features = features
			.map((feature) => {
				const filteredProperties = feature.properties
					.map((property) => {
						const filteredAnswers = property.answers.filter((answer) => answer.reg === register);
						return { ...property, answers: filteredAnswers };
					})
					.filter((property) => property.answers.length > 0);

				return { ...feature, properties: filteredProperties };
			})
			.filter((feature) => feature.properties.length > 0);
	}
	if (activeRegister.value && activeRegister.value !== "all") {
		const registerValues = registerGroups.find((r) => r.name === activeRegister.value)?.values;
		if (registerValues?.length) {
			features = features
				.map((feature) => {
					const filteredProperties = feature.properties
						.map((property) => {
							const filteredAnswers = property.answers.filter((answer) =>
								registerValues.includes(answer.reg),
							);
							return { ...property, answers: filteredAnswers };
						})
						.filter((property) => property.answers.length > 0);

					return { ...feature, properties: filteredProperties };
				})
				.filter((feature) => feature.properties.length > 0);
		}
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
		const color = colors[i];
		if (color) {
			colorMap[u.anno] = color;
		}
	});
	return colorMap;
});

const filteredPoints = computed(() => {
	let filteredPoints = points.value;
	if (activeTags.value.length) {
		filteredPoints = filteredPoints
			.map((entry) => {
				const filteredProperties = entry.properties
					.map((property) => {
						const filteredAnswers = property.answers.filter((answer) =>
							activeTags.value.includes(answer.anno),
						);
						return { ...property, answers: filteredAnswers };
					})
					.filter((property) => property.answers.length > 0);

				return { ...entry, properties: filteredProperties };
			})
			.filter((entry) => entry.properties.length > 0);
	}
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

// const uniqueVariants = computed((): Array<string> => {
// 	const uniqueAnnos = new Set();

// 	filteredPoints.value.forEach((p) => {
// 		p.properties.forEach((property) => {
// 			property.answers.forEach((answer) => {
// 				uniqueAnnos.add(answer.anno);
// 			});
// 		});
// 	});

// 	const uniqueVariants = Array.from(uniqueAnnos);
// 	return uniqueVariants as Array<string>;
// });

const uniqueVariants = computed(() => {
	const annoCounts = new Map<string, number>();

	filteredPoints.value.forEach((p) => {
		p.properties.forEach((property) => {
			property.answers.forEach((answer) => {
				const anno = answer.anno;
				if (annoCounts.has(anno)) {
					// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
					annoCounts.set(anno, annoCounts.get(anno)! + 1);
				} else {
					annoCounts.set(anno, 1);
				}
			});
		});
	});

	// Convert the Map entries to an array and sort it by count in descending order
	const sortedVariants = Array.from(annoCounts.entries())
		.sort((a, b) => b[1] - a[1])
		.map((entry) => ({ anno: entry[0], count: entry[1] }));

	return sortedVariants;
});

const uniqueVariantsOptions = computed((): Array<DropdownOption> => {
	return uniqueVariants.value.map((variant) => ({
		value: variant.anno.toLocaleLowerCase(),
		label: variant.anno,
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
			coordinates: coordinates,
			entities,
		};
	}
}

type OccurrenceCount = Record<
	string,
	Record<
		string,
		{
			reg: string;
			count: number;
		}
	>
>;

const countOccurrences = (properties: Array<Property>) => {
	const counts: OccurrenceCount = {};
	for (const property of properties) {
		for (const answer of property.answers) {
			const anno = answer.anno;
			const reg = answer.reg;
			if (!counts[anno]) {
				counts[anno] = {};
			}
			const annoValue = counts[anno];
			if (annoValue && !annoValue[reg]) {
				annoValue[reg] = { reg, count: 0 };
			}
			const annoRegValue = annoValue?.[reg];
			if (annoRegValue) {
				annoRegValue.count++;
			}
		}
	}
	return counts;
};

// watch(data2, () => {
// 	/**
// 	 * Close popover when search results change, to avoid displaying popup for features which are
// 	 * no longer in the search results set.
// 	 */
// 	popover.value = null;
// });

const resetSelection = (omit?: Array<"description" | "question" | "register">) => {
	if (!omit?.includes("question")) {
		activeQuestion.value = "";
	}
	if (!omit?.includes("description")) {
		activeRegisterDescription.value = "all";
	}
	if (!omit?.includes("register")) {
		activeRegister.value = "all";
	}
	activeTags.value = [];
};

watch(activeQuestion, () => {
	resetSelection(["question"]);
});
watch(activeRegisterDescription, () => {
	if (activeRegisterDescription.value !== "") {
		resetSelection(["question", "description"]);
	}
});
watch(activeRegister, () => {
	if (activeRegister.value !== "") {
		resetSelection(["question", "register"]);
	}
});
</script>

<template>
	<div class="relative grid grid-rows-[auto_1fr] gap-5">
		<div class="rounded-lg border p-5">
			<div class="mb-4 grid grid-flow-col gap-5">
				<div>
					<div class="mb-1 ml-1 flex gap-1 text-sm font-semibold">
						{{ t("MapsPage.selection.variable.title") }}
						<InfoTooltip :content="t('MapsPage.selection.variable.tooltip')">
							<InformationCircleIcon class="size-5"></InformationCircleIcon>
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
						{{ t("MapsPage.selection.register-categories.title") }}
						<InfoTooltip :content="t('MapsPage.selection.register-categories.tooltip')">
							<InformationCircleIcon class="size-5"></InformationCircleIcon>
						</InfoTooltip>
					</div>
					<Combobox
						v-model="activeRegister"
						:options="registerCategories"
						:placeholder="t('MapsPage.selection.register-categories.placeholder')"
					/>
				</div>
				<div>
					<div class="mb-1 ml-1 flex gap-1 text-sm font-semibold">
						{{ t("MapsPage.selection.register-definition.title") }}
						<InfoTooltip :content="t('MapsPage.selection.register-definition.tooltip')">
							<InformationCircleIcon class="size-5"></InformationCircleIcon>
						</InfoTooltip>
					</div>
					<Combobox
						v-model="activeRegisterDescription"
						:options="registerDescriptions"
						:placeholder="t('MapsPage.selection.register-definition.placeholder')"
					/>
				</div>
				<div>
					<div class="mb-1 ml-1 flex gap-1 text-sm font-semibold">
						{{ t("MapsPage.selection.variants.title") }}
						<InfoTooltip :content="t('MapsPage.selection.variants.tooltip')">
							<InformationCircleIcon class="size-5"></InformationCircleIcon>
						</InfoTooltip>
					</div>
					<TagsCombobox
						v-model="activeTags"
						:options="uniqueVariantsOptions"
						:placeholder="t('MapsPage.selection.variants.placeholder')"
					/>
				</div>
			</div>
			<div class="flex gap-4">
				<div class="flex space-x-2 self-center">
					<Checkbox id="showData" v-model:checked="showAllPoints" />
					<label
						for="showData"
						class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
					>
						{{ t("MapsPage.selection.show-all-points") }}
					</label>
				</div>
				<div class="flex space-x-2 self-center">
					<Checkbox id="showRegions" v-model:checked="showRegions" />
					<label
						for="showRegions"
						class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
					>
						{{ t("MapsPage.selection.show-regions") }}
					</label>
				</div>
				<Button @click="resetSelection()">{{ t("MapsPage.selection.reset") }}</Button>
			</div>
		</div>
		<VisualisationContainer v-slot="{ height, width }" class="border">
			<div v-if="uniqueVariants.length" class="absolute bottom-12 right-0 z-10 mr-2">
				<div class="rounded-md border-2 border-transparent bg-white p-3 text-sm shadow-md">
					<ul class="space-y-1">
						<li
							v-for="variant in uniqueVariants"
							:key="variant.anno"
							:class="{ 'italic-custom': !['Sonstige', 'Sonstiges'].includes(variant.anno) }"
						>
							<svg width="12" height="12" class="inline align-baseline">
								<circle cx="6" cy="6" r="6" :fill="mappedColors[variant.anno]" />
							</svg>
							{{ variant.anno }}
						</li>
					</ul>
				</div>
			</div>
			<GeoMap
				v-if="height && width"
				:features="features"
				:points="dataPoints"
				:height="height"
				:width="width"
				:show-all-points="showAllPoints"
				:show-regions="showRegions"
				@layer-click="onLayerClick"
			>
				<GeoMapPopup
					v-if="popover !== null"
					:coordinates="popover.coordinates as [number, number]"
					@close="popover = null"
				>
					<article class="grid gap-1">
						<div v-for="entity in popover.entities" :key="entity.id">
							<p>{{ entity.location }}, {{ entity.PLZ }}</p>
							<ul>
								<li v-for="(value, key) in countOccurrences(entity.properties)" :key="key">
									<p v-for="(v, k) in value" :key="k" class="">
										<svg width="12" height="12" class="mr-0.5 inline align-text-top">
											<circle cx="6" cy="6" r="6" :fill="mappedColors[key]" />
										</svg>
										{{ key }}, {{ v.reg }}: {{ v.count }}
									</p>
								</li>
							</ul>
						</div>
					</article>
				</GeoMapPopup>
			</GeoMap>

			<!-- <Centered v-if="isLoading" class="pointer-events-none">
				<LoadingIndicator class="text-neutral-950" size="lg" />
			</Centered> -->
		</VisualisationContainer>
	</div>
</template>
