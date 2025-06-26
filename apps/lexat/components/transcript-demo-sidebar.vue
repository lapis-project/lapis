<script lang="ts" setup>
import { DownloadIcon, EyeIcon, XIcon } from "lucide-vue-next";

import type { Transcript } from "@/pages/transcripts/[id].vue";
import transcripts from "@/transcripts-demo.json";

const route = useRoute();
const router = useRouter();

const currentSelectionIds = computed(() => {
	const sel = route.query.selection;
	if (!sel) return [];
	return Array.isArray(sel) ? (sel as Array<string>) : [sel];
});

const currentId = ref<string | null>(null);
const currentTranscripts = ref<Array<Transcript> | null>(null);

function removeSelection(id: number) {
	if (currentTranscripts.value == null) return;

	if (currentSelectionIds.value.length === 1) {
		removeAllSelections();
		return;
	}

	const updatedSelection = currentSelectionIds.value.filter((s) => String(s) !== String(id));

	void router.push({ query: { ...route.query, selection: updatedSelection } });

	// Also update your reactive data if needed
	currentTranscripts.value = currentTranscripts.value?.filter(
		(item) => String(item.id) !== String(id),
	);
}

const speakerTexts = computed(() => {
	if (!currentTranscripts.value || !currentId.value) return [];

	const current = currentTranscripts.value.find((t) => String(t.id) === currentId.value);
	if (!current) return [];

	return current.events.map((event) => {
		const speakers = event.speakers
			.map((speaker) => {
				const tokens = speaker.tokens.map((token) => token.ortho?.text ?? "").filter(Boolean);

				if (tokens.length === 0) return null;

				return {
					name: speaker.name,
					text: tokens.join(" "),
				};
			})
			.filter(Boolean); // Remove nulls from empty-token speakers

		return {
			event: event.event,
			speakers,
		};
	});
});

function removeAllSelections() {
	const newQuery = { ...route.query };
	delete newQuery.selection;
	void router.push({ query: { ...newQuery } });
	currentTranscripts.value = null;
}

function toggleActiveTab(id: string) {
	currentId.value = id;
}

const previousSelection: Array<string> = [];

watch(
	currentSelectionIds,
	(selection) => {
		const newAdded: string | undefined = selection.find((id) => !previousSelection.includes(id));
		currentId.value = newAdded ?? null;

		currentTranscripts.value = transcripts.transcripts.filter((item) =>
			selection.some((id) => String(item.id) === id),
		);

		if (newAdded) {
			previousSelection.push(newAdded);
		}
	},
	{ immediate: true },
);
</script>

<template>
	<div class="mb-5 pb-3 border-b flex gap-2 items-end flex-shrink-0 overflow-x-auto">
		<div v-for="item in currentTranscripts" :key="item.id">
			<div
				:class="
					String(item.id) === currentId
						? `py-1.5 px-3 flex items-center rounded bg-neutral-900 text-white border-none gap-2 text-sm`
						: `py-1.5 px-3 flex items-center rounded bg-secondary border gap-2 text-sm`
				"
			>
				<Button
					class="h-full m-0 size-fit cursor-pointer"
					size="icon"
					variant="transparent"
					@click="toggleActiveTab(String(item.id))"
				>
					{{ item.name }}
				</Button>
				<Button
					class="h-full m-0 size-fit cursor-pointer"
					size="icon"
					variant="transparent"
					@click="removeSelection(item.id)"
				>
					<XIcon class="size-4" />
				</Button>
			</div>
		</div>
	</div>
	<Tabs class="w-full flex flex-col flex-grow min-h-0" default-value="plain">
		<div class="flex gap-4 items-center">
			<TabsList class="w-full items-stretch">
				<TabsTrigger value="plain"> Plain </TabsTrigger>
				<TabsTrigger value="kwic"> KWIC </TabsTrigger>
				<TabsTrigger value="xml"> XML </TabsTrigger>
			</TabsList>
			<NuxtLinkLocale
				class="inline-flex rounded p-3 hover:bg-accent hover:text-accent-foreground focus-visible:outline-hidden focus-visible:ring-2 disabled:pointer-events-none focus-visible:ring-offset-2 disabled:opacity-50"
				focus-visible:ring-ring
				font-med
				:href="{
					path: currentId ? `/transcripts/${currentId}` : '',
				}"
				items-center
				ium
				justify-center
				ring-offset-background
				rounded-md
				text-sm
				transition-colors
				whitespace-nowrap
			>
				<span class="sr-only"> Detailview Demo </span>
				<EyeIcon class="size-4" />
			</NuxtLinkLocale>
			<Button class="shrink-0" size="icon" variant="ghost"><DownloadIcon class="size-4" /></Button>
		</div>
		<TabsContent
			v-if="currentId != null"
			class="flex-grow w-full overflow-auto min-h-0"
			value="plain"
		>
			<UtteranceViewOptions class="mb-3"></UtteranceViewOptions>
			<div class="divide-y w-full divide-gray-200">
				<div v-for="(hit, index) in speakerTexts" :key="index" class="px-1 py-3 text-sm">
					<div v-for="(speaker, speakerIndex) in hit.speakers" :key="speakerIndex" class="flex">
						<div v-if="speakerIndex === 0" class="min-w-[10rem] text-gray-500 pr-2">
							{{ hit.event }}
						</div>
						<div v-else class="min-w-[10rem]"></div>
						<div>
							<span class="font-semibold pr-1">{{ speaker?.name }}</span>
							<span>{{ speaker?.text }}</span>
						</div>
					</div>
				</div>
			</div>
		</TabsContent>
		<TabsContent value="kwic"> Sample content </TabsContent>
		<TabsContent value="xml"> Sample content </TabsContent>
	</Tabs>
</template>
