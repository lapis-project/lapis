<script setup lang="ts">
import Draggable from "vuedraggable";

import type { TagNode } from "./tag-drop-zone.vue";

const props = defineProps<{
	tags: Array<TagNode>;
	groupName: string;
}>();

const availableTags = ref<Array<TagNode>>([]);

watch(
	() => {
		return props.tags;
	},
	() => {
		availableTags.value = props.tags;
	},
);
</script>

<template>
	<div class="flex flex-col pr-10 py-4 h-full">
		<Label class="text-sm text-muted-foreground mb-2" for="tags">Verfügbare Tags</Label>

		<div class="h-full">
			<Draggable
				v-if="availableTags.length > 0"
				id="tags"
				v-model="availableTags"
				class="overflow-y-auto"
				:group="{ name: groupName, pull: true, put: false }"
				item-key="value"
			>
				<template #item="{ element }">
					<div class="cursor-move px-2 py-1 bg-muted rounded my-1">
						{{ element.label }}
					</div>
				</template>
			</Draggable>
			<div v-else class="text-muted-foreground text-xs">Keine Tags verfügbar.</div>
		</div>
	</div>
</template>
