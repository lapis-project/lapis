<script lang="ts" setup>
import { PlusCircleIcon, SearchIcon } from "lucide-vue-next";

const searchInput = ref("");
const tagLayerOne = ref<Array<{ label: string; value: string }>>([
	{ label: "POSS", value: "poss" },
	{ label: "ADJINT", value: "adjint" },
	{ label: "KONJ", value: "konj" },
	{ label: "NEGC", value: "negc" },
	{ label: "PROG", value: "prog" },
	{ label: "RELS", value: "rels" },
]);

const activeTagLayerOneOption = ref<string | null>(null);
const activeTagLayerTwoOption = ref<string | null>(null);
const activeTagLayerThreeOption = ref<string | null>(null);
const tagLayerTwoActive = ref(false);
const tagLayerThreeActive = ref(false);

function setNextLayer(layer: number) {
	switch (layer) {
		case 1:
			tagLayerTwoActive.value = true;
			break;
		case 2:
			tagLayerThreeActive.value = true;
			break;
	}
}
</script>

<template>
	<div class="flex relative items-center mb-4 pb-4 border-b gap-4">
		<form class="flex gap-4 items-end flex-shrink-0">
			<Label class="sr-only" for="search">Suche</Label>
			<div class="relative w-64">
				<Input
					id="search"
					v-model="searchInput"
					class="pl-10"
					placeholder="Suchbegriff eingeben"
					type="text"
				/>
				<span class="absolute inset-y-0 start-0 flex items-center justify-center px-2">
					<SearchIcon class="size-6 text-muted-foreground" />
				</span>
			</div>
			<Button type="submit"> Suchen </Button>
		</form>
		<Separator orientation="vertical" />
		<div class="flex gap-1 items-center">
			<BaseSelect
				id="context"
				v-model="activeTagLayerOneOption"
				:options="tagLayerOne"
				placeholder="Tag wählen"
			></BaseSelect>
			<div v-if="!tagLayerTwoActive">
				<Button
					v-if="activeTagLayerOneOption"
					class="p-2 h-8 m-0"
					variant="ghost"
					@click="setNextLayer(1)"
				>
					<PlusCircleIcon :size="18" />
				</Button>
			</div>
			<div v-else>
				<PlusCircleIcon class="text-accent-foreground mx-2" :size="18" />
			</div>
			<BaseSelect
				v-if="tagLayerTwoActive"
				id="context"
				v-model="activeTagLayerTwoOption"
				:options="tagLayerOne"
				placeholder="Tag wählen"
			></BaseSelect>
			<div v-if="!tagLayerThreeActive">
				<Button
					v-if="activeTagLayerTwoOption"
					class="p-2 h-8 m-0"
					variant="ghost"
					@click="setNextLayer(2)"
				>
					<PlusCircleIcon :size="18" />
				</Button>
			</div>
			<div v-else>
				<PlusCircleIcon class="text-accent-foreground mx-2" :size="18" />
			</div>
			<BaseSelect
				v-if="tagLayerThreeActive"
				id="context"
				v-model="activeTagLayerThreeOption"
				:options="tagLayerOne"
				placeholder="Tag wählen"
			></BaseSelect>
		</div>
	</div>
</template>
