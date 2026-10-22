<script lang="ts" setup>
import { BookmarkIcon, DownloadIcon } from "@lucide/vue";

import type { APITranscriptsWithBookmark } from "@/types/api";

const props = defineProps<{
	transcripts: APITranscriptsWithBookmark;
}>();

const emit = defineEmits<{
	select: [id: string];
	bookmark: [transcript: APITranscriptsWithBookmark[number]];
}>();

function onSelect(id: number | string | null | undefined) {
	if (id == null) return;
	emit("select", String(id));
}
</script>

<template>
	<div v-if="props.transcripts.length > 0" class="flex flex-col gap-2">
		<div v-for="result in props.transcripts" :key="String(result.instance_id ?? '')" class="pb-1">
			<div
				class="mx-2 rounded bg-gray-100 font-medium text-gray-700 transition-transform duration-200 ease-in-out hover:scale-101 hover:border-foreground/80"
			>
				<div
					class="py-2 px-4 rounded bg-gray-100 font-medium text-gray-700 grid grid-cols-[auto_1fr] items-center"
				>
					<NuxtLinkLocale
						class="text-black underline decoration-dotted transition hover:no-underline focus-visible:no-underline hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-offset-2"
						:href="{
							path: result.instance_id ? `/transcripts/${result.instance_id}` : '',
						}"
					>
						{{ result.transcript_name ?? `Transcript ${result.instance_id}` }}
					</NuxtLinkLocale>

					<div class="w-full flex justify-end items-center gap-2">
						<Button class="shrink-0" size="icon" variant="ghost"
							><DownloadIcon class="size-4"
						/></Button>
						<Button class="p-0 w-fit self-end" variant="ghost" @click="emit('bookmark', result)">
							<BookmarkIcon class="size-4" :fill="result.bookmarked ? 'black' : 'none'" />
						</Button>
					</div>
				</div>
			</div>
		</div>
	</div>
	<div v-else class="text-md text-muted-foreground justify-center flex m-auto">
		Keine Ergebnisse vorhanden.
	</div>
</template>
