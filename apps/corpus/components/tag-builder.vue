<script lang="ts" setup>
import { PlusCircleIcon } from "lucide-vue-next";

import results from "@/assets/data/dioe-tags-tree.json";

// const tagLayerOne = ref<Array<{ label: string; value: string }>>([
// 	{ label: "POSS", value: "poss" },
// 	{ label: "ADJINT", value: "adjint" },
// 	{ label: "KONJ", value: "konj" },
// 	{ label: "NEGC", value: "negc" },
// 	{ label: "PROG", value: "prog" },
// 	{ label: "RELS", value: "rels" },
// ]);

const tagLayerOne = computed(() => {
	return results.results
		.filter((res) => {
			return res.tag_gene === 0;
		})
		.map((r) => {
			return { value: r.tag_id, label: r.tag_abbrev };
		});
});

const tagLayerTwo = computed(() => {
	return results.results
		.filter((res) => {
			return (
				res.tag_gene === 1 && res.parent_ids.includes(parseInt(activeTagLayerOneOption.value ?? ""))
			);
		})
		.map((r) => {
			return { value: r.tag_id, label: r.tag_abbrev };
		});
});

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
	<div class="grid grid-cols-2 gap-1 items-center">
		<div>
			<Label class="text-sm text-muted-foreground" for="context">Tag Ebene</Label>
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
				:options="tagLayerTwo"
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
		<div class="justify-self-end border border-muted-foreground rounded">
			<div v-for="tag in tagLayerTwo" :key="tag.value">
				{{ tag.label }}
			</div>
		</div>
	</div>
</template>
