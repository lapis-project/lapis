```vue
<script setup lang="ts">
import {
	BookmarkIcon,
	CircleQuestionMarkIcon,
	FileText,
	Folder,
	FolderOpen,
	Undo2,
} from "@lucide/vue";
import { TreeItem, TreeRoot } from "reka-ui";

import { usePlaces } from "#imports";
import TreeModeSwitcher from "@/components/tree-mode-switcher.vue";
import { useSettingsProjectsFilter } from "@/composables/use-settings-projects";

import { austrianStates } from "../../../backend/src/lib/austrianPostalCodes.ts";

type FilterSidebarTranscript = {
	id?: number | string;
	name?: string;
	setting?: number;
	location?: number;
	icon?: string;
	bookmarked?: boolean;
};

const router = useRouter();
const route = useRoute();

const props = defineProps<{
	transcripts: Array<FilterSidebarTranscript>;
}>();

const emit = defineEmits(["closeFilterSidebar", "handleBookmark", "handleSelection"]);

const { response: filter } = useSettingsProjectsFilter();
const { response: places } = usePlaces(2);

function queryValue(key: string): string | undefined {
	const value = route.query[key];
	const first = Array.isArray(value) ? value[0] : value;

	return first == null || first === "" ? undefined : String(first);
}

function setQueryValue(key: string, value: string | undefined) {
	const query = { ...route.query };

	if (value == null || value === "") {
		delete query[key];
	} else {
		query[key] = value;
	}

	return router.replace({ query });
}

const activeContext = computed<string | undefined>({
	get: () => queryValue("projects"),
	set: (value) => {
		void setQueryValue("projects", value);
	},
});

const activeSetting = computed<string | undefined>({
	get: () => queryValue("settings"),
	set: (value) => {
		void setQueryValue("settings", value);
	},
});

const activeLocation = computed<string | undefined>({
	get: () => queryValue("locations"),
	set: (value) => {
		void setQueryValue("locations", value);
	},
});

const activeState = computed<string | undefined>({
	get: () => queryValue("state"),
	set: (value) => {
		void setQueryValue("state", value);
	},
});

const activeGender = computed<string | undefined>({
	get: () => queryValue("gender"),
	set: (value) => {
		void setQueryValue("gender", value);
	},
});

const activeAgeGroup = computed<string | undefined>({
	get: () => {
		const lower = queryValue("age_lower");
		const upper = queryValue("age_upper");

		if (lower == null && upper == null) return undefined;

		return `${lower ?? "18"}-${upper ?? "999"}`;
	},
	set: (value) => {
		const query = { ...route.query };

		if (!value) {
			delete query.age_lower;
			delete query.age_upper;
		} else {
			const [lower, upper] = value.split("-");
			query.age_lower = lower;
			query.age_upper = upper;
		}

		void router.replace({ query });
	},
});

const searchName = computed<string>({
	get: () => queryValue("transcript_name") ?? "",
	set: (value) => {
		void setQueryValue("transcript_name", value || undefined);
	},
});

const searchId = computed<string>({
	get: () => queryValue("instance_id") ?? "",
	set: (value) => {
		void setQueryValue("instance_id", value || undefined);
	},
});

const bkmsEnabled = computed<boolean>({
	get: () => queryValue("has_bkms") === "true",
	set: (value) => {
		void setQueryValue("has_bkms", value ? "true" : undefined);
	},
});

const standardCompetenceEnabled = computed<boolean>({
	get: () => queryValue("standard_competence") != null,
	set: (enabled) => {
		void setQueryValue(
			"standard_competence",
			enabled ? (queryValue("standard_competence") ?? "1") : undefined,
		);
	},
});

const standardCompetenceValue = computed<number[] | null>({
	get: () => {
		const value = queryValue("standard_competence");

		if (value == null) return null;

		const number = Number(value);
		return Number.isFinite(number) ? [number] : null;
	},
	set: (value) => {
		void setQueryValue("standard_competence", value?.[0] == null ? undefined : String(value[0]));
	},
});

const dialectCompetenceEnabled = computed<boolean>({
	get: () => queryValue("dialect_competence") != null,
	set: (enabled) => {
		void setQueryValue(
			"dialect_competence",
			enabled ? (queryValue("dialect_competence") ?? "1") : undefined,
		);
	},
});

const dialectCompetenceValue = computed<number[] | null>({
	get: () => {
		const value = queryValue("dialect_competence");

		if (value == null) return null;

		const number = Number(value);
		return Number.isFinite(number) ? [number] : null;
	},
	set: (value) => {
		void setQueryValue("dialect_competence", value?.[0] == null ? undefined : String(value[0]));
	},
});

const activeFilterCount = computed(() => {
	const filters = [
		queryValue("projects"),
		queryValue("settings"),
		queryValue("locations"),
		queryValue("state"),
		queryValue("gender"),
		queryValue("standard_competence"),
		queryValue("dialect_competence"),
		queryValue("transcript_name"),
		queryValue("instance_id"),
	];

	let count = filters.filter(Boolean).length;

	if (queryValue("age_lower") != null || queryValue("age_upper") != null) {
		count++;
	}

	if (queryValue("has_bkms") === "true") {
		count++;
	}

	return count;
});

const hasActiveFilters = computed(() => activeFilterCount.value > 0);

const projectOptions = computed<Array<{ label: string; value: string }>>(() => {
	return (filter.value?.projects ?? [])
		.filter((project) => project.name != null)
		.toSorted((a, b) => a.name!.localeCompare(b.name!, "de"))
		.map((project) => ({
			label: project.name!,
			value: String(project.id),
		}));
});

const settingOptions = computed<Array<{ label: string; value: string }>>(() => {
	return (filter.value?.settings ?? [])
		.filter((setting) => setting.name != null)
		.toSorted((a, b) => a.name!.localeCompare(b.name!, "de"))
		.map((setting) => ({
			label: setting.name!,
			value: String(setting.id),
		}));
});

const ageGroupOptions = ref<Array<{ label: string; value: string }>>([
	{ label: "18-35", value: "18-35" },
	{ label: "65+", value: "65-999" },
]);

const genderOptions = ref<Array<{ label: string; value: string }>>([
	{ label: "Männlich", value: "männlich" },
	{ label: "Weiblich", value: "weiblich" },
	{ label: "Divers", value: "divers" },
]);

const locationOptions = computed<Array<{ label: string; value: string }>>(() => {
	return (places.value ?? [])
		.filter((place) => place.place_name != null)
		.toSorted((a, b) => a.place_name!.localeCompare(b.place_name!, "de"))
		.map((place) => ({
			label: place.place_name!,
			value: String(place.id),
		}));
});

const stateOptions = computed<Array<{ label: string; value: string }>>(() => {
	return austrianStates.map((state) => ({
		label: state.name,
		value: String(state.id),
	}));
});

const treeMode = ref<"Setting" | "Ort" | "Informant">("Setting");

const filteredTranscripts = computed(() => {
	return props.transcripts.filter((transcript) => {
		if (activeSetting.value && transcript.setting !== Number(activeSetting.value)) {
			return false;
		}

		if (activeLocation.value && transcript.location !== Number(activeLocation.value)) {
			return false;
		}

		return true;
	});
});

const bookmarkedTranscripts = computed(() => {
	return props.transcripts.filter((entry) => entry.bookmarked);
});

const treeItems = computed(() => {
	const groups = filteredTranscripts.value.reduce(
		(acc, transcript) => {
			if (transcript.setting == null) return acc;

			if (!acc[transcript.setting]) {
				acc[transcript.setting] = [];
			}

			acc[transcript.setting]?.push({
				id: String(transcript.id),
				title: transcript.name,
				icon: transcript.icon,
			});

			return acc;
		},
		{} as Record<number, Array<{ id: string; title?: string; icon?: string }>>,
	);

	return Object.entries(groups).map(([setting, transcripts]) => ({
		id: setting,
		title: setting,
		icon: "lucide:folder",
		children: transcripts,
	}));
});

function handleBookmark(transcript: FilterSidebarTranscript) {
	emit("handleBookmark", transcript);
}

function handleSelection(id: string) {
	emit("handleSelection", id);
}

function clearAllFilters() {
	const query = { ...route.query };

	for (const key of [
		"projects",
		"settings",
		"locations",
		"state",
		"gender",
		"age_lower",
		"age_upper",
		"standard_competence",
		"dialect_competence",
		"has_bkms",
		"transcript_name",
		"instance_id",
	]) {
		delete query[key];
	}

	return router.replace({ query });
}
</script>

<template>
	<div class="flex h-full min-h-0 flex-col">
		<Tabs class="w-full flex flex-col flex-grow min-h-0" default-value="filter">
			<TabsList class="w-full flex-shrink-0">
				<TabsTrigger value="tree">Tree</TabsTrigger>
				<TabsTrigger class="inline-flex items-center gap-2" value="filter">
					<span>Filter</span>
				</TabsTrigger>
				<TabsTrigger value="bookmark">
					Bibliothek
					<span
						v-if="bookmarkedTranscripts.length > 0"
						class="bg-black text-white text-xs rounded-full w-4 h-4 flex items-center justify-center"
					>
						{{ bookmarkedTranscripts.length }}
					</span>
				</TabsTrigger>
			</TabsList>

			<TabsContent class="mt-5 flex-grow overflow-y-auto min-h-0" value="tree">
				<TreeRoot
					v-slot="{ flattenItems }"
					class="list-none select-none w-full rounded-lg border shadow-sm p-2 text-sm"
					:default-expanded="['0']"
					:get-key="(item) => item.id || item.id"
					:items="treeItems"
				>
					<div class="flex items-center justify-between">
						<h2 class="font-semibold text-sm text-stone-400 px-2 pt-1 pb-3">Transkriptionen</h2>
						<TreeModeSwitcher v-model="treeMode" />
					</div>

					<TreeItem
						v-for="item in flattenItems"
						:key="item._id"
						v-slot="{ isExpanded }"
						v-bind="item.bind"
						class="flex items-center py-1 px-2 rounded outline-none focus:ring-grass8 focus:ring-2 data-[selected]:bg-grass4"
						:style="{ 'padding-left': `${item.level - 0.5}rem` }"
					>
						<template v-if="item.hasChildren">
							<Folder v-if="!isExpanded" class="size-4" />
							<FolderOpen v-else class="size-4" />
							<span class="pl-2">{{ item.value.title }}</span>
						</template>

						<template v-else>
							<FileText class="size-4" />
							<Button
								class="p-0 pl-2 h-fit font-normal underline decoration-dotted transition hover:no-underline focus-visible:no-underline"
								variant="transparent"
								@click="handleSelection(String(item.value.id))"
							>
								<span class="sr-only">Open Detail Sidebar</span>
								{{ item.value.title }}
							</Button>
						</template>
					</TreeItem>
				</TreeRoot>
			</TabsContent>

			<TabsContent class="mt-5 flex-grow overflow-y-auto min-h-0" value="filter">
				<div class="flex flex-col gap-4">
					<div class="grid w-full gap-1.5 border-b pb-4">
						<div class="grid w-full gap-1.5 pb-4">
							<Label class="tracking-wide pl-1" for="name-input"> Transkriptname </Label>
							<div class="flex gap-2">
								<Input id="name-input" v-model="searchName" placeholder="Transkriptname eingeben" />
								<Button size="icon" variant="outline" @click="searchName = ''">
									<Undo2 class="size-4" />
								</Button>
							</div>
						</div>

						<div class="grid w-full gap-1.5">
							<Label class="tracking-wide pl-1" for="id-input"> Transkript ID </Label>
							<div class="flex gap-2">
								<Input id="id-input" v-model="searchId" placeholder="Transkript ID eingeben" />
								<Button size="icon" variant="outline" @click="searchId = ''">
									<Undo2 class="size-4" />
								</Button>
							</div>
						</div>
					</div>

					<div class="grid w-full gap-1.5">
						<Label class="tracking-wide pl-1" for="context"> Projektkontext </Label>
						<div class="flex gap-2">
							<BaseSelect
								id="context"
								v-model="activeContext"
								:options="projectOptions"
								placeholder="Projektkontext wählen..."
							/>
							<Button size="icon" variant="outline" @click="activeContext = undefined">
								<Undo2 class="size-4" />
							</Button>
						</div>
					</div>

					<div class="grid w-full gap-1.5 pb-4 border-b">
						<Label class="tracking-wide pl-1" for="setting"> Setting </Label>
						<div class="flex gap-2">
							<BaseSelect
								id="setting"
								v-model="activeSetting"
								:options="settingOptions"
								placeholder="Setting wählen..."
							/>
							<Button size="icon" variant="outline" @click="activeSetting = undefined">
								<Undo2 class="size-4" />
							</Button>
						</div>
					</div>

					<div class="text-lg mb-1">Raum</div>

					<div class="grid w-full gap-1.5">
						<Label class="tracking-wide pl-1" for="location"> Ort </Label>
						<div class="flex gap-2">
							<BaseSelect
								id="location"
								v-model="activeLocation"
								:options="locationOptions"
								placeholder="Ort wählen..."
							/>
							<Button size="icon" variant="outline" @click="activeLocation = undefined">
								<Undo2 class="size-4" />
							</Button>
						</div>
					</div>

					<div class="grid w-full gap-1.5">
						<Label class="tracking-wide pl-1" for="state"> Bundesland </Label>
						<div class="flex gap-2">
							<BaseSelect
								id="state"
								v-model="activeState"
								:options="stateOptions"
								placeholder="Bundesland wählen..."
							/>
							<Button size="icon" variant="outline" @click="activeState = undefined">
								<Undo2 class="size-4" />
							</Button>
						</div>
					</div>

					<div class="grid w-full gap-1.5 border-b"></div>
					<div class="text-lg mb-1">Sprecher:innen</div>

					<div class="grid w-full gap-1.5">
						<Label class="tracking-wide pl-1" for="age"> Altersgruppe </Label>
						<div class="flex gap-2">
							<BaseSelect
								id="age"
								v-model="activeAgeGroup"
								:options="ageGroupOptions"
								placeholder="Altersgruppe wählen..."
							/>
							<Button size="icon" variant="outline" @click="activeAgeGroup = undefined">
								<Undo2 class="size-4" />
							</Button>
						</div>
					</div>

					<div class="grid w-full gap-1.5">
						<Label class="tracking-wide pl-1" for="gender"> Geschlecht </Label>
						<div class="flex gap-2">
							<BaseSelect
								id="gender"
								v-model="activeGender"
								:options="genderOptions"
								placeholder="Geschlecht wählen..."
							/>
							<Button size="icon" variant="outline" @click="activeGender = undefined">
								<Undo2 class="size-4" />
							</Button>
						</div>
					</div>

					<div class="grid w-full gap-1.5 border-b"></div>
					<div class="text-lg mb-1">Sprachrepertoires</div>

					<div class="grid my-2">
						<div class="flex w-full justify-between">
							<span class="flex-row flex gap-2">
								<Checkbox
									type="checkbox"
									id="competence-enabled"
									v-model="standardCompetenceEnabled"
								/>
								<Label class="tracking-wide pl-1" for="nos"> Standardsprachkompetenz </Label>
								<TooltipProvider>
									<Tooltip>
										<TooltipTrigger as-child>
											<CircleQuestionMarkIcon
												:size="16"
												class="text-gray-400 hover:text-gray-500"
											/>
										</TooltipTrigger>
										<TooltipContent>
											Selbstauskunft auf einer siebenstufigen Skala (Deutsch)
										</TooltipContent>
									</Tooltip>
								</TooltipProvider>
							</span>

							<span
								v-if="standardCompetenceEnabled && standardCompetenceValue"
								class="text-xs text-muted-foreground"
							>
								{{ standardCompetenceValue[0] }}
							</span>
						</div>

						<div class="grid w-full">
							<Collapsible :open="standardCompetenceEnabled">
								<CollapsibleContent
									class="overflow-hidden data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down data-[state=open]:mt-3"
								>
									<div class="flex flex-row my-2.5 mx-1.5">
										<Slider v-model="standardCompetenceValue" :max="7" :min="1" :step="1" />
									</div>
								</CollapsibleContent>
							</Collapsible>
						</div>
					</div>

					<div class="grid my-2">
						<div class="flex w-full justify-between">
							<span class="flex-row flex gap-2">
								<Checkbox
									type="checkbox"
									id="dialect-competence-enabled"
									v-model="dialectCompetenceEnabled"
								/>
								<Label class="tracking-wide pl-1" for="nos"> Dialektkompetenz </Label>
								<TooltipProvider>
									<Tooltip>
										<TooltipTrigger as-child>
											<CircleQuestionMarkIcon
												:size="16"
												class="text-gray-400 hover:text-gray-500"
											/>
										</TooltipTrigger>
										<TooltipContent>
											Selbstauskunft auf einer siebenstufigen Skala (Deutsch)
										</TooltipContent>
									</Tooltip>
								</TooltipProvider>
							</span>

							<span
								v-if="dialectCompetenceEnabled && dialectCompetenceValue"
								class="text-xs text-muted-foreground"
							>
								{{ dialectCompetenceValue[0] }}
							</span>
						</div>

						<div class="grid w-full">
							<Collapsible :open="dialectCompetenceEnabled">
								<CollapsibleContent
									class="overflow-hidden data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down data-[state=open]:mt-3"
								>
									<div class="flex flex-row my-2.5 mx-1.5">
										<Slider v-model="dialectCompetenceValue" :max="7" :min="1" :step="1" />
									</div>
								</CollapsibleContent>
							</Collapsible>
						</div>
					</div>

					<div class="grid my-2">
						<div class="flex w-full justify-between">
							<span class="flex-row flex gap-2">
								<Checkbox type="checkbox" id="bkms-enabled" v-model="bkmsEnabled" />
								<Label class="tracking-wide pl-1" for="nos">BKMS</Label>
							</span>
						</div>
					</div>
				</div>
			</TabsContent>

			<TabsContent class="mt-5 flex-grow overflow-y-auto min-h-0" value="bookmark">
				<div v-if="bookmarkedTranscripts.length <= 0" class="text-sm text-muted-foreground">
					Es befinden sich derzeit keine gespeicherten Transkripte in Ihrer Bibliothek.
				</div>

				<div v-else>
					<div v-for="result in bookmarkedTranscripts" :key="result.id">
						<div
							class="px-4 py-2 mb-2 bg-gray-100 font-semibold text-gray-700 grid grid-cols-[auto_1fr] items-center justify-between"
						>
							<Button
								class="underline text-md text-black decoration-dotted transition hover:no-underline focus-visible:no-underline p-0"
								variant="transparent"
								@click="handleSelection(String(result.id))"
							>
								<span class="sr-only">Open Sidebar Demo</span>
								{{ result.name }}
							</Button>

							<div class="w-full flex justify-end">
								<Button
									class="p-0 w-fit self-end"
									variant="transparent"
									@click="handleBookmark(result)"
								>
									<BookmarkIcon :fill="result.bookmarked ? 'black' : 'none'" />
								</Button>
							</div>
						</div>
					</div>
				</div>
			</TabsContent>
		</Tabs>
	</div>
</template>
```
