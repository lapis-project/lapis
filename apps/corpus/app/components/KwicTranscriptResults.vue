<script lang="ts" setup>
import { BookmarkIcon, CopyIcon } from "@lucide/vue";
import { toast } from "vue-sonner";

import type { APIKwicResponse, APIMatchesByTranscript, KwicLine } from "@/types/api";

const props = defineProps<{
	kwic: APIKwicResponse;
	transcripts: APIMatchesByTranscript;
	bookmarkedIds: Array<string>;
}>();

const emit = defineEmits<{
	select: [id: string];
	bookmark: [transcript: any];
}>();

const kwicPanels = ref<Record<string, boolean>>({});

function getTranscriptIdFromRefs(references: Array<string> | undefined) {
	for (const reference of references ?? []) {
		const match = /(?:^|\W)transcript_(\d+)(?:\W|$)/i.exec(reference);
		if (!match?.[1]) continue;
		const id = Number(match[1]);
		if (Number.isSafeInteger(id)) return id;
	}
	return null;
}

const groupedTranscriptLines = computed(() => {
	const groups = Object.entries((props.transcripts ?? {}) as Record<string, any>)
		.filter(([, match]) => Array.isArray(match?.lines) && match.lines.length > 0)
		.map(([transcriptId, match]) => ({
			transcriptId,
			transcript: match?.transcript ?? null,
			lines: match?.lines ?? [],
			xmlHits: match?.xmlHits ?? [],
		}));

	if (groups.length > 0) return groups;

	const fallback: Array<{
		transcriptId: string;
		transcript: null;
		lines: Array<KwicLine>;
		xmlHits: Array<{ refs: string; content: string }>;
	}> = [];
	const seen = new Set<string>();
	for (const line of props.kwic?.Lines ?? []) {
		const transcriptId =
			getTranscriptIdFromRefs(line.Tbl_refs) ?? getTranscriptIdFromRefs(line.Refs) ?? null;
		if (transcriptId == null) continue;
		const key = String(transcriptId);
		if (!seen.has(key)) {
			seen.add(key);
			fallback.push({
				transcriptId: key,
				transcript: null,
				lines: [],
				xmlHits: [],
			});
		}
		const group = fallback.find((entry) => entry.transcriptId === key);
		if (group) group.lines.push(line);
	}

	return fallback.filter((group) => group.lines.length > 0);
});

function getKwicLineId(line: KwicLine) {
	return line.Tbl_refs?.[0] ?? line.Refs?.[0] ?? `kwic-${line.toknum ?? "unknown"}`;
}

function getKwicTextTokenValue(token: { str?: string; strc?: string } | undefined) {
	return token?.str ?? token?.strc ?? "";
}

function transcriptBookmarked(transcript: any) {
	if (!transcript?.instance_id) return false;
	return props.bookmarkedIds.includes(String(transcript.instance_id));
}

function getTranscriptFromGroup(group: { transcript: any; transcriptId: string }) {
	return group.transcript ?? null;
}

function handleBookmark(transcript: any) {
	if (!transcript?.instance_id) return;
	const item = {
		...transcript,
		bookmarked: transcriptBookmarked(transcript),
	};
	emit("bookmark", item as any);
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
</script>

<template>
	<div v-if="groupedTranscriptLines.length > 0" class="flex flex-col gap-2">
		<div v-for="group in groupedTranscriptLines" :key="group.transcriptId" class="px-2 pb-2">
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
						@click="emit('select', String(group.transcriptId))"
					>
						{{
							getTranscriptFromGroup(group)?.transcript_name ?? `Transcript ${group.transcriptId}`
						}}
					</Button>
					<div class="w-full flex justify-end items-center gap-2">
						<span class="text-xs text-muted-foreground font-normal">
							{{ group.lines.length }} Treffer
						</span>
						<Button
							variant="ghost"
							size="sm"
							class="h-7 px-2"
							@click="
								kwicPanels[String(group.transcriptId)] = !(
									kwicPanels[String(group.transcriptId)] ?? false
								)
							"
						>
							{{ kwicPanels[String(group.transcriptId)] ? "Weniger" : "Mehr" }}
						</Button>
						<Button
							class="p-0 w-fit self-end"
							variant="transparent"
							@click="handleBookmark(getTranscriptFromGroup(group))"
						>
							<BookmarkIcon
								:fill="transcriptBookmarked(getTranscriptFromGroup(group)) ? 'black' : 'none'"
							/>
						</Button>
					</div>
				</div>

				<div v-if="kwicPanels[String(group.transcriptId)]" class="border-t bg-white px-3 py-3">
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

						<div class="flex flex-col gap-1">
							<div
								v-for="(line, index) in group.lines"
								:key="`${group.transcriptId}-${getKwicLineId(line)}-${index}`"
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
												>{{ getKwicTextTokenValue(token) }}</span
											>
										</div>

										<div
											class="h-full flex font-semibold text-accent-foreground bg-accent-foreground/20 rounded-sm space-y-1 transition-transform duration-200 ease-in-out hover:scale-110 hover:border-background/10 p-2.5 text-center whitespace-nowrap"
										>
											<span
												v-for="(token, tokenIndex) in line.Kwic"
												:key="tokenIndex"
												class="mr-1"
												>{{ token.str }}</span
											>
										</div>

										<div
											class="h-full p-2 border rounded bg-white border-foreground/20 text-sm space-y-1 text-left transition-transform duration-200 ease-in-out hover:scale-101 hover:border-foreground/80 whitespace-nowrap"
										>
											<span
												v-for="(token, tokenIndex) in line.Right"
												:key="tokenIndex"
												class="mr-1"
												>{{ getKwicTextTokenValue(token) }}</span
											>
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
											@click="copyKwicLine(group.xmlHits[index]?.content ?? '', 'xml')"
										>
											XML
										</DropdownMenuItem>
									</DropdownMenuContent>
								</DropdownMenu>
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	</div>
	<div v-else class="text-md text-muted-foreground justify-center flex m-auto">
		Keine Ergebnisse vorhanden.
	</div>
</template>
