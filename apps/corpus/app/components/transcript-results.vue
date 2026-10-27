<script lang="ts" setup>
import { BookmarkIcon, CopyIcon, DownloadIcon } from "@lucide/vue";
import { AccordionContent, AccordionItem, AccordionRoot, AccordionTrigger } from "reka-ui";
import { toast } from "vue-sonner";

import type { APITranscriptsWithBookmark, KwicLine, SearchParams } from "@/types/api";

const props = defineProps<{
	transcripts: APITranscriptsWithBookmark;
	transcriptHitCounts?: Record<string, { hitCount?: number | null }>;
	currentSearchParams: SearchParams | null;
	hasKwicSearch: boolean;
}>();

const emit = defineEmits<{
	bookmark: [transcript: APITranscriptsWithBookmark[number]];
}>();

const { response, isPending, fetchTranscriptHits, generateCacheKey } = useHitsPerTranscript(2);

function getKwicTextTokenValue(token: { str?: string; strc?: string } | undefined) {
	return token?.str ?? token?.strc ?? "";
}

function copyKwicLine(line: KwicLine | string, category: string) {
	let text = "";
	let output = "";
	if (category === "kwic" && typeof line !== "string") {
		const left = line.Left?.map((t: any) => t.str).join(" ") ?? "";
		const kwic = line.Kwic?.map((t: any) => t.str).join(" ") ?? "";
		const right = line.Right?.map((t: any) => t.str).join(" ") ?? "";

		text = `${left} ${kwic} ${right}`.replace(/\s+/g, " ").trim();
		output = "Zeile";
	} else if (category === "xml" && typeof line === "string") {
		text = line;
		output = "XML";
	} else return;

	navigator.clipboard.writeText(text).then(() => {
		toast.success(`${output} wurde in die Zwischenablage kopiert!`);
	});
}

function transcriptBookmarked(transcript: APITranscriptsWithBookmark[number]) {
	if (!transcript?.instance_id) return false;
	return transcript.bookmarked;
}

function handleBookmark(transcript: APITranscriptsWithBookmark[number]) {
	if (!transcript?.instance_id) return;
	const item = {
		...transcript,
		bookmarked: transcriptBookmarked(transcript),
	};
	emit("bookmark", item as APITranscriptsWithBookmark[number]);
}

async function toggleTranscriptHits(id: number, params: SearchParams) {
	await fetchTranscriptHits(id, params);
}
</script>

<template>
	<div v-if="props.transcripts.length > 0" class="flex flex-col gap-3">
		<div
			v-for="transcript in props.transcripts"
			:key="transcript.instance_id!"
			class="mx-2 rounded bg-gray-100 font-medium text-gray-700 transition-transform duration-200 ease-in-out hover:scale-101 hover:border-foreground/80 shadow-sm"
		>
			<Collapsible>
				<div class="flex items-center justify-between gap-3 px-3 py-2">
					<NuxtLinkLocale
						class="text-black underline decoration-dotted transition hover:no-underline focus-visible:no-underline hover:bg-accent hover:text-accent-foreground focus-visible:ring-2 focus-visible:ring-offset-2"
						:href="{
							path: transcript.instance_id ? `/transcripts/${transcript.instance_id}` : '',
						}"
					>
						{{ transcript.transcript_name ?? `Transcript ${transcript.instance_id}` }}
					</NuxtLinkLocale>

					<div class="flex items-center gap-2">
						<div v-if="props.hasKwicSearch">
							<span class="text-xs text-muted-foreground font-normal">
								{{ props.transcriptHitCounts?.[String(transcript.instance_id)]?.hitCount }}
								Treffer
							</span>

							<CollapsibleTrigger as-child>
								<Button
									variant="ghost"
									size="sm"
									class="h-7 px-2 text-xs font-medium"
									@click="
										toggleTranscriptHits(
											transcript.instance_id ?? 0,
											props.currentSearchParams ?? { has_bkms: false },
										)
									"
								>
									{{ "Mehr" }}
								</Button>
							</CollapsibleTrigger>
						</div>

						<Button class="shrink-0" size="icon" variant="ghost"
							><DownloadIcon class="size-4"
						/></Button>
						<Button class="p-0 w-fit self-end" variant="ghost" @click="handleBookmark(transcript)">
							<BookmarkIcon
								class="size-4"
								:fill="transcriptBookmarked(transcript) ? 'black' : 'none'"
							/>
						</Button>
					</div>
				</div>

				<CollapsibleContent class="border-t bg-white">
					<div class="px-3 py-3">
						<div class="flex flex-col gap-2">
							<div
								class="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2 px-1 py-2 text-sm text-muted-foreground"
							>
								<span>Line ID</span>
								<div
									class="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 text-center"
								>
									<span class="text-right">Linker Kontext</span>
									<span class="px-2">KWIC</span>
									<span class="text-left">Rechter Kontext</span>
								</div>
								<span class="sr-only">Aktionen</span>
							</div>

							<div
								v-if="isPending(transcript.instance_id!, props.currentSearchParams!)"
								class="justify-center flex m-auto p-4"
							>
								<Spinner />
							</div>
							<div
								v-else-if="
									response[generateCacheKey(transcript.instance_id!, props.currentSearchParams!)]
								"
								class="flex flex-col gap-1"
							>
								<div
									v-for="(line, index) in response[
										generateCacheKey(transcript.instance_id!, props.currentSearchParams!)
									].kwic.Lines"
									:key="line.toknum"
									class="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-2"
								>
									<span class="pt-3 text-xs text-muted-foreground">
										{{ line.toknum }}
									</span>

									<button
										type="button"
										class="rounded hover:text-accent-foreground focus-visible:outline-hidden focus-visible:ring-2 disabled:pointer-events-none focus-visible:ring-offset-2 disabled:opacity-50"
									>
										<div
											class="px-3 py-2 text-sm grid grid-cols-[1fr_auto_1fr] gap-2 items-center transition-transform duration-200 ease-in-out hover:scale-101 hover:border-foreground/80 whitespace-nowrap"
										>
											<div
												class="h-full p-2 border rounded bg-white border-foreground/20 text-sm space-y-1 text-right transition-transform duration-200 ease-in-out hover:scale-101 hover:border-foreground/80 whitespace-nowrap"
											>
												<span
													v-for="(token, tokenIndex) in line.Left"
													:key="tokenIndex"
													class="mr-1"
												>
													{{ getKwicTextTokenValue(token) }}
												</span>
											</div>

											<div
												class="h-full flex font-semibold text-accent-foreground bg-accent-foreground/20 rounded-sm space-y-1 transition-transform duration-200 ease-in-out hover:scale-110 hover:border-background/10 p-2.5 text-center whitespace-nowrap"
											>
												<span
													v-for="(token, tokenIndex) in line.Kwic"
													:key="tokenIndex"
													class="mr-1"
												>
													{{ token.str }}
												</span>
											</div>

											<div
												class="h-full p-2 border rounded bg-white border-foreground/20 text-sm space-y-1 text-left transition-transform duration-200 ease-in-out hover:scale-101 hover:border-foreground/80 whitespace-nowrap"
											>
												<span
													v-for="(token, tokenIndex) in line.Right"
													:key="tokenIndex"
													class="mr-1"
												>
													{{ getKwicTextTokenValue(token) }}
												</span>
											</div>
										</div>
									</button>

									<DropdownMenu>
										<DropdownMenuTrigger as-child>
											<Button
												variant="ghost"
												size="icon"
												class="h-8 w-8"
												aria-label="KWIC-Zeile kopieren"
											>
												<CopyIcon class="size-4" />
											</Button>
										</DropdownMenuTrigger>

										<DropdownMenuContent>
											<DropdownMenuItem @click="copyKwicLine(line, 'kwic')">
												Plain Text
											</DropdownMenuItem>
											<DropdownMenuItem
												@click="
													copyKwicLine(
														response[
															generateCacheKey(transcript.instance_id!, props.currentSearchParams!)
														].matchesByTranscript['1'].xmlHits[index].content ?? '',
														'xml',
													)
												"
											>
												XML
											</DropdownMenuItem>
										</DropdownMenuContent>
									</DropdownMenu>
								</div>
							</div>
							<div
								v-else-if="
									!isPending(transcript.instance_id!, props.currentSearchParams!) &&
									!response[generateCacheKey(transcript.instance_id!, props.currentSearchParams!)]
								"
								class="text-muted-foreground text-sm justify-center m-auto p-4"
							>
								Keine Treffer für dieses Transkript.
							</div>
						</div>
					</div>
				</CollapsibleContent>
			</Collapsible>
		</div>
	</div>
</template>
