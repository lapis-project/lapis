<script setup lang="ts">
import { EyeIcon } from "lucide-vue-next";

import speakerInfo from "@/assets/data/speaker-info.json";

export interface Speaker {
	id: number;
	name: string;
	age: string;
	sex: string;
	occupation: string;
	transcripts: Array<number>;
}

const props = defineProps<{
	speakerName: string;
	currentId: string;
}>();

const currentSpeaker = ref<Speaker | null | undefined>(null);

function getSpeakerInfo(name: string) {
	const speaker = speakerInfo.speakers.find((speaker) => {
		return speaker.name === name;
	});

	currentSpeaker.value = speaker;
}
</script>

<template>
	<div>
		<span class="font-semibold pr-1">
			<Dialog>
				<DialogTrigger as-child class="p-0 m-0">
					<Button
						class="p-0.5 h-full"
						variant="ghost"
						@click="getSpeakerInfo(props.speakerName ?? '')"
					>
						{{ props.speakerName }}</Button
					>
				</DialogTrigger>
				<DialogContent class="flex flex-col gap-1">
					<h1>
						<span>Sprecher:in</span>
						<span class="pl-1 text-lg font-semibold">{{ currentSpeaker?.name }}</span>
					</h1>
					<div class="grid w-full gap-1.5 border-b" />
					<ul class="space-y-1 text-sm text-muted-foreground pt-3">
						<li>
							<span class="font-medium text-foreground">Alter:</span>
							{{ currentSpeaker?.age }}
						</li>
						<li>
							<span class="font-medium text-foreground">Geschlecht:</span>
							{{ currentSpeaker?.sex }}
						</li>
						<li>
							<span class="font-medium text-foreground">Beruf:</span>
							{{ currentSpeaker?.occupation }}
						</li>
						<li>
							<span class="font-medium text-foreground">Transkripte:</span>
							<ul class="list-disc list-inside ml-4">
								<li v-for="id in currentSpeaker?.transcripts" :key="id">
									<span class="inline-flex gap-1 items-center">
										<span>Transcript0{{ id }}</span>
										<NuxtLinkLocale
											class="text-black inline-flex rounded p-2 hover:bg-accent hover:text-accent-foreground focus-visible:outline-hidden focus-visible:ring-2 disabled:pointer-events-none focus-visible:ring-offset-2 disabled:opacity-50"
											:href="{
												path: props.currentId ? `/transcripts/${props.currentId}` : '',
											}"
										>
											<span class="sr-only"> Detailview Demo </span>
											<EyeIcon class="size-4" />
										</NuxtLinkLocale>
									</span>
								</li>
							</ul>
						</li>
					</ul>
				</DialogContent>
			</Dialog>
		</span>
	</div>
</template>
