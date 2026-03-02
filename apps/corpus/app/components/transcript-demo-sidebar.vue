<script lang="ts" setup>
import { DownloadIcon, EyeIcon, XIcon } from "lucide-vue-next";
import Spinner from "../../../ui/app/components/ui/spinner/Spinner.vue";

const route = useRoute();
const router = useRouter();

const currentId = ref<number | null>(null);

const { response, isPending, refreshTranscripts } = useTranscriptPreview(currentId);

const transcript = computed(() => {
	return response.value;
});

function removeSelection() {
	const query = { ...route.query };
	delete query.selection;

	void router.push({ ...route.query });
}

onMounted(() => {
	const val = route.query.selection;
	const selection = Array.isArray(val) ? Number(val[0]) : (Number(val) ?? currentId.value);
	currentId.value = isNaN(selection) ? null : selection;
});

watch(
	() => route.query.selection,
	(val) => {
		const selection = Array.isArray(val) ? Number(val[0]) : (Number(val) ?? null);
		currentId.value = isNaN(selection) ? null : selection;
	},
);
</script>

<template>
	<div v-if="isPending" class="item-center m-auto">
		<Spinner />
	</div>
	<div v-else>
		<div class="mb-5 pb-3 border-b flex gap-2 items-end flex-shrink-0 overflow-x-auto">
			<div v-for="item in transcript" :key="item">
				<div
					:class="
						currentId
							? `py-1.5 px-3 flex items-center rounded bg-neutral-900 text-white border-none gap-2 text-sm`
							: `py-1.5 px-3 flex items-center rounded bg-secondary border gap-2 text-sm`
					"
				>
					<Button class="h-full m-0 size-fit cursor-pointer" size="icon" variant="transparent">
						Transcript {{ currentId }}
					</Button>
					<Button
						class="h-full m-0 size-fit cursor-pointer"
						size="icon"
						variant="transparent"
						@click="removeSelection()"
					>
						<XIcon class="size-4" />
					</Button>
				</div>
			</div>
		</div>
		<Tabs class="w-full flex flex-col flex-grow min-h-0" default-value="info">
			<div class="flex gap-4 items-center">
				<TabsList class="w-full items-stretch">
					<TabsTrigger value="info">Info</TabsTrigger>
					<TabsTrigger value="plain"> Plain </TabsTrigger>
					<TabsTrigger value="kwic"> KWIC </TabsTrigger>
					<TabsTrigger value="xml"> XML </TabsTrigger>
				</TabsList>
				<NuxtLinkLocale
					class="inline-flex rounded p-3 hover:bg-accent hover:text-accent-foreground focus-visible:outline-hidden focus-visible:ring-2 disabled:pointer-events-none focus-visible:ring-offset-2 disabled:opacity-50"
					:href="{
						path: currentId ? `/transcripts/${currentId}` : '',
					}"
				>
					<span class="sr-only"> Detailview Demo </span>
					<EyeIcon class="size-4" />
				</NuxtLinkLocale>
				<Button class="shrink-0" size="icon" variant="ghost"
					><DownloadIcon class="size-4"
				/></Button>
			</div>
			<TabsContent class="p-4 text-sm text-muted-foreground space-y-2" value="info">
				<div v-if="transcript != null">
					<div class="space-y-2" v-for="item in transcript" :key="item">
						<h2 class="text-lg font-semibold text-foreground">
							Transcript {{ item.transcript_id }}
						</h2>
						<ul class="space-y-3">
							<li>
								<span class="font-medium text-foreground">Ort:</span>
								<span class="pl-1">{{ item.place_name }}</span>
							</li>
							<li>
								<span class="font-medium text-foreground">Setting:</span>
								<span class="pl-1">{{ item.survey_type_name }}</span>
							</li>

							<li>
								<span class="font-medium text-foreground">Sprecher:innen:</span>
								<span
									v-for="(speaker, index) in item.informants"
									:key="index"
									class="pl-1 inline-flex"
								>
									<SpeakerButton :current-id="currentId ?? ''" :speaker="speaker" />
									<span v-if="index < item.informants.length - 1" class="-ml-1">, </span>
								</span>
							</li>
							<!-- needs review 
						<li>
							<span class="font-medium text-foreground">Anzahl der Events:</span>
							<span class="pl-1">{{ transcript..length }}</span>
						</li> 
						-->
						</ul>
					</div>
				</div>
			</TabsContent>
			<!-- needs review
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
						<span class="flex flex-row items-center">
							<SpeakerButton
								:current-id="currentId"
								:speaker-name="speaker?.name ?? ''"
							></SpeakerButton>

							<span>{{ speaker?.text }}</span>
						</span>
					</div>
				</div>
			</div>
		</TabsContent> -->
			<TabsContent value="plain"> Sample content </TabsContent>
			<TabsContent value="kwic"> Sample content </TabsContent>
			<TabsContent value="xml"> Sample content </TabsContent>
		</Tabs>
	</div>
</template>
