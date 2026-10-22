<script lang="ts" setup>
import { BookmarkIcon } from "@lucide/vue";

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
				class="mx-1 rounded bg-gray-100 font-semibold text-gray-700 transition-transform duration-200 ease-in-out hover:scale-101 hover:border-foreground/80"
			>
				<div
					class="py-2 px-4 rounded bg-gray-100 font-semibold text-gray-700 grid grid-cols-[auto_1fr] items-center"
				>
					<Button
						class="underline text-md text-black decoration-dotted transition hover:no-underline focus-visible:no-underline p-0 text-left"
						hover:no-underline
						variant="transparent"
						@click="onSelect(result.instance_id)"
					>
						<span class="sr-only">Open Sidebar Demo</span>
						{{ result.transcript_name }}
					</Button>
					<div class="w-full flex justify-end">
						<Button
							class="p-0 w-fit self-end"
							variant="transparent"
							@click="emit('bookmark', result)"
						>
							<BookmarkIcon :fill="result.bookmarked ? 'black' : 'none'" />
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
