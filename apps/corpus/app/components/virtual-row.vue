<script setup lang="ts">
import type { TimestampEvent } from "@/types/api";

const props = defineProps<{
	block: TimestampEvent | undefined;
	rowIndex: number;
	speakers: number[];
	hiddenSpeakers: Set<number>;
	showLu: boolean;
	showPhon: boolean;
	maxEventsPerRow: number;
	highlightTargetIndex: (
		rowIndex: number,
		speakerId: number,
		eventIndex: number,
		field: "ortho",
		tokenIndex: number,
	) => number;
}>();
</script>

<template>
	<div
		v-if="block != null"
		class="grid w-full"
		:data-row-index="rowIndex"
		:style="{
			gridTemplateColumns: `160px repeat(${maxEventsPerRow}, max-content)`,
			gridTemplateRows: `auto repeat(${speakers.length}, minmax(64px, auto))`,
		}"
	>
		<!-- Timeline headers -->
		<div class="pl-2 text-white bg-black font-bold text-sm rounded-tl">Zeitleiste</div>
		<div
			v-for="(stamp, idx) in block.timestamps"
			:key="'header-' + idx"
			class="text-xs text-start py-1 text-white bg-black relative z-10 px-2"
		>
			{{ stamp }}
		</div>

		<!-- Speakers -->
		<template v-for="speaker in speakers.filter((s) => !hiddenSpeakers.has(s))" :key="speaker">
			<div class="text-sm font-semibold p-2 bg-gray-200 border border-foreground/20 min-h-[64px]">
				<div class="flex flex-col h-full justify-between">
					<div class="text-sm font-normal text-right pr-3 text-gray-500">
						<TooltipProvider>
							<Tooltip>
								<TooltipTrigger>o</TooltipTrigger>
								<TooltipContent>Standardorthografische Transkription</TooltipContent>
							</Tooltip>
						</TooltipProvider>
					</div>

					<div v-if="showLu" class="text-sm font-normal text-right pr-3 text-gray-500">
						<TooltipProvider>
							<Tooltip>
								<TooltipTrigger>lu</TooltipTrigger>
								<TooltipContent>Lautorientierte Transkription</TooltipContent>
							</Tooltip>
						</TooltipProvider>
					</div>

					<div v-if="showPhon" class="text-sm font-normal text-right pr-3 text-gray-500">
						<TooltipProvider>
							<Tooltip>
								<TooltipTrigger>phon</TooltipTrigger>
								<TooltipContent>Phonetische Transkription</TooltipContent>
							</Tooltip>
						</TooltipProvider>
					</div>
				</div>
			</div>

			<div
				v-for="(e, idx) in block.speakerEvents[speaker]"
				:key="speaker + '-event-' + idx"
				class="h-full flex p-2 border rounded bg-white border-foreground/20 text-sm space-y-1 transition-transform duration-200 ease-in-out hover:scale-105 hover:border-foreground/80"
			>
				<Dialog>
					<DialogTrigger as-child class="h-full">
						<div
							class="grid gap-1 h-full"
							:style="{
								gridTemplateColumns: 'repeat(' + e.ortho.length + ', minmax(0, auto))',
							}"
						>
							<div
								v-for="(token, index) in e.ortho"
								:key="'token-group-' + index"
								class="flex flex-col justify-between h-full group hover:cursor-pointer hover:bg-gray-100"
							>
								<div
									class="px-0.5 whitespace-nowrap text-start text-sm"
									:data-highlight-target="
										highlightTargetIndex(rowIndex, speaker, idx, 'ortho', index)
									"
									:data-highlighted-token="token.isKwic ? 'true' : 'false'"
									:data-current-highlighted-token="false"
									:class="[
										token.hasTags ? 'text-accent-foreground font-semibold' : '',
										token.isKwic
											? 'shrink-0 overflow-hidden rounded-md bg-accent-foreground/20 text-center px-1 font-semibold text-accent-foreground'
											: '',
									]"
								>
									{{ token.text }}
								</div>

								<div
									v-if="showLu"
									class="px-0.5 whitespace-nowrap text-start text-gray-600 text-sm"
									:class="{ invisible: !e.lu[index]?.text }"
								>
									{{ e.lu[index]?.text }}
								</div>

								<div
									v-if="showPhon"
									class="px-0.5 whitespace-nowrap text-start text-gray-500 text-sm"
									:class="{ invisible: !e.phon[index]?.text }"
								>
									{{ e.phon[index]?.text }}
								</div>

								<div class="h-1 w-full rounded bg-gray-300 group-hover:bg-accent-foreground"></div>
							</div>
						</div>
					</DialogTrigger>

					<DialogContent class="sm:max-w-[425px]">
						<DialogHeader>
							<DialogTitle>Details</DialogTitle>
							<DialogDescription>Hier finden Sie weitere Informationen</DialogDescription>
						</DialogHeader>
						<div>
							<div>
								<span class="font-semibold mr-1">Sprecher:</span>
								<span class="text-xs">{{ speaker }}</span>
							</div>

							<div class="border border-b w-full mt-2"></div>

							<p class="font-semibold mt-2">Tokens:</p>
							<p v-if="e.lu" class="italic text-sm mt-2">Standardorthografische Transkription:</p>
							<p>
								<span v-for="(token, i) in e.ortho" :key="i" class="mr-1 text-xs">{{
									token.text
								}}</span>
							</p>

							<p v-if="e.lu" class="italic text-sm mt-2">Lautorientierte Transkription:</p>
							<p v-if="e.lu">
								<span v-for="(token, i) in e.lu" :key="i" class="mr-1 text-xs">{{
									token.text
								}}</span>
							</p>

							<p v-if="e.phon" class="italic text-sm mt-2">Phonetische Transkription:</p>
							<p v-if="e.phon">
								<span v-for="(token, i) in e.phon" :key="i" class="mr-1 text-xs">{{
									token.text
								}}</span>
							</p>

							<div class="border border-b w-full mt-2"></div>

							<p class="font-semibold mt-2">Annotationen:</p>
							<div class="mr-1 text-xs">loremipsum</div>

							<div class="border border-b w-full mt-2"></div>
						</div>
					</DialogContent>
				</Dialog>
			</div>
		</template>
	</div>
</template>
