<script lang="ts" setup>
import { PlusCircleIcon, XIcon } from "lucide-vue-next";

import type { TagNode } from "./tag-drop-zone.vue";

type LogicType = "AND" | "OR" | "NOT";

interface BuilderBlock {
	id: number;
	logic?: LogicType;
}

const legend = ref<Array<LegendItem>>([
	{ depth: 0, color: "#fd9a00" },
	{ depth: 1, color: "#ad46ff" },
	{ depth: 2, color: "#a9326a" },
	{ depth: 3, color: "#009689" },
	{ depth: 4, color: "#104e64" },
]);

function handleLegendColor(newLegend: typeof legend.value) {
	legend.value = newLegend;
}

const builders = ref<Array<BuilderBlock>>([{ id: 1, logic: undefined }]);

function addBuilder(logic: LogicType) {
	tagSelected.value = !tagSelected.value;

	builders.value.push({
		id: Date.now(),
		logic,
	});
}

function editBuilderLogic(newLogic: LogicType, currentBuilderId: number) {
	const builder = builders.value.find((el) => {
		return el.id === currentBuilderId;
	});

	if (builder) builder.logic = newLogic;
}

function removeBuilder(id: number) {
	//needs review (only one, remove all from that on)

	const index = builders.value.findIndex((b) => b.id === id);
	if (index !== -1) builders.value.splice(index, 1);
}

function openBuilderPopover(builderId: number) {
	activeBuilderId.value = builderId;
}

function toggleBuilder(hasAnnotation: boolean, builderId: number) {
	if (hasAnnotation) {
		tagSelected.value = true;
		activeBuilderId.value = builderId;
	} else {
		activeBuilderId.value = null;
	}
}

function handleAvailableTags(tags: Array<TagNode>, groupName: string) {
	availableTags.value = tags;
	availableGroupName.value = groupName;
}

const availableTags = ref<Array<TagNode>>([]);
const availableGroupName = ref<string>("tags-root");

const tagSelected = ref(false);
const activeBuilderId = ref<number | null>(null);
</script>

<template>
	<div class="relative grid grid-cols-[1fr_auto] gap-2 h-full">
		<div class="flex flex-col flex-1 min-h-0 w-full h-full max-h-full overflow-y-auto">
			<div
				v-for="builder in builders"
				:key="builder.id"
				class="relative w-full border rounded-xl px-4 shadow-sm"
			>
				<Button
					class="absolute top-2 right-2 z-50"
					size="icon"
					variant="ghost"
					@click="removeBuilder(builder.id)"
				>
					<XIcon :size="16" />
				</Button>
				<div
					class="absolute left-1/2 z-40 -translate-x-1/2 -translate-y-1/2 h-8 text-xs pt-4 text-muted-foreground"
				>
					<Popover v-if="builder.logic">
						<PopoverTrigger as-child>
							<Button
								class="h-8 m-0 text-xs"
								variant="ghost"
								@click="openBuilderPopover(builder.id)"
							>
								{{ builder.logic }}
							</Button>
						</PopoverTrigger>
						<PopoverContent align="start" class="w-fit flex flex-row gap-1 p-1">
							<Button
								class="justify-start"
								variant="ghost"
								@click="editBuilderLogic('AND', builder.id)"
							>
								AND
							</Button>
							<Button
								class="justify-start"
								variant="ghost"
								@click="editBuilderLogic('OR', builder.id)"
							>
								OR
							</Button>
							<Button
								class="justify-start"
								variant="ghost"
								@click="editBuilderLogic('NOT', builder.id)"
							>
								NOT
							</Button>
						</PopoverContent>
					</Popover>
				</div>

				<TagBuilder
					:legend="legend"
					@annotation-selected="(hasAnnotation) => toggleBuilder(hasAnnotation, builder.id)"
					@available-tags="handleAvailableTags"
				/>

				<div v-if="activeBuilderId === builder.id && tagSelected">
					<Popover>
						<PopoverTrigger as-child>
							<Button
								class="h-8 m-0 p-2"
								p-2
								variant="ghost"
								@click="openBuilderPopover(builder.id)"
							>
								<PlusCircleIcon :size="18" />
							</Button>
						</PopoverTrigger>
						<PopoverContent align="start" class="w-fit flex flex-row gap-1 p-1">
							<Button class="justify-start" variant="ghost" @click="addBuilder('AND')">
								AND
							</Button>
							<Button class="justify-start" variant="ghost" @click="addBuilder('OR')"> OR </Button>
							<Button class="justify-start" variant="ghost" @click="addBuilder('NOT')">
								NOT
							</Button>
						</PopoverContent>
					</Popover>
				</div>
			</div>
		</div>
		<div class="h-full flex flex-col">
			<div class="h-full w-full border px-4 shadow-sm">
				<AnnotationTags :group-name="availableGroupName" :tags="availableTags"></AnnotationTags>
			</div>
			<div class="relative w-full border px-4 shadow-sm">
				<AnnotationLegend @update-legend="handleLegendColor" />
			</div>
		</div>
	</div>
</template>
