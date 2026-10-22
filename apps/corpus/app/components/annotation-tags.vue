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
	<div class="flex h-full min-w-0 flex-col py-4 pr-2">
		<Label class="mb-2 text-sm text-muted-foreground" for="tags">Verfügbare Tags</Label>

		<div class="min-h-0 w-full min-w-[180px] max-w-[240px] flex-1 overflow-hidden">
			<Draggable
				v-if="availableTags.length > 0"
				id="tags"
				v-model="availableTags"
				class="h-full overflow-y-auto overflow-x-hidden rounded border bg-muted/30 p-2"
				:group="{ name: groupName, pull: true, put: false }"
				item-key="value"
			>
				<template #item="{ element }">
					<div class="cursor-move my-1 rounded bg-muted px-2 py-1 text-sm break-words">
						{{ element.label }}
					</div>
				</template>
			</Draggable>
			<div v-else class="text-xs text-muted-foreground">Keine Tags verfügbar.</div>
		</div>
	</div>
</template>
