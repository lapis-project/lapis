<script setup lang="ts">
import type { Event, TimestampEvent } from "@/types/api";

const props = defineProps<{
	block: TimestampEvent | undefined;
	speakers: number[];
	hiddenSpeakers: Set<number>;
	showLu: boolean;
	showPhon: boolean;
	maxEventsPerRow: number;
}>();
</script>

<template>
	<div
		v-if="block != null"
		class="grid w-full"
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
				<div class="flex flex-row justify-between">
					{{ speaker }}
					<div class="text-sm font-normal text-right pr-3 text-gray-500 h-full">
						<TooltipProvider>
							<Tooltip>
								<TooltipTrigger> o </TooltipTrigger>
								<TooltipContent>Standardorthografische Transkription</TooltipContent>
							</Tooltip>
						</TooltipProvider>
					</div>
				</div>

				<div v-if="showLu" class="text-sm font-normal text-right pr-3 text-gray-500">
					<TooltipProvider>
						<Tooltip>
							<TooltipTrigger> lu </TooltipTrigger>
							<TooltipContent>Lautorientierte Transkription</TooltipContent>
						</Tooltip>
					</TooltipProvider>
				</div>
				<div v-if="showPhon" class="text-sm font-normal text-right pr-3 text-gray-500">
					<TooltipProvider>
						<Tooltip>
							<TooltipTrigger> phon </TooltipTrigger>
							<TooltipContent>Phonetische Transkription</TooltipContent>
						</Tooltip>
					</TooltipProvider>
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
								class="grid grid-rows-[auto_1fr] items-end group hover:cursor-pointer h-full hover:bg-gray-100"
							>
								<div
									class="px-0.5 m-0 whitespace-nowrap py-0.5 text-start text-sm"
									:class="token.hasTags ? 'text-accent-foreground font-semibold' : ''"
								>
									{{ token.text }}
								</div>
								<div
									v-if="showLu"
									class="px-0.5 m-0 whitespace-nowrap py-0.5 text-start text-gray-600 text-sm"
									:class="e.lu[index]?.hasTags ? 'text-accent-foreground  font-semibold' : ''"
								>
									{{ e.lu[index]?.text }}
								</div>

								<div
									v-if="showPhon"
									class="px-0.5 m-0 whitespace-nowrappy-0.5 text-start text-gray-500 text-sm"
									:class="e.phon[index]?.hasTags ? 'text-accent-foreground  font-semibold' : ''"
								>
									{{ e.phon[index]?.text }}
								</div>

								<div
									class="h-1 flex w-full relative py-0.5 rounded bg-gray-300 transition-colors duration-200 group-hover:bg-accent-foreground group-hover:cursor-pointer"
								></div>
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
