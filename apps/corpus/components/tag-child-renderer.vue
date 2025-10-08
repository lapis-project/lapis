<script setup lang="ts">
import { PlusCircleIcon, XIcon } from "lucide-vue-next";

import type { LegendItem } from "./annotation-legend.vue";
import type { TagNode } from "./tag-drop-zone.vue";

const props = defineProps<{
	node: TagNode | null | undefined;
	loadChildren: (node: TagNode) => Array<TagNode>;
	hasChildren?: (node: TagNode) => boolean;
	depth: number;
	colors: Array<LegendItem>;
}>();

const emit = defineEmits<{
	(e: "removeTag" | "loadChildren", node: TagNode): void;
}>();

const expanded = ref(false);
const isActiveDropZone = ref(false);

function activateDropZone() {
	isActiveDropZone.value = true;
}

function handleLoadChildren() {
	if (!currentNode.value || !props.loadChildren) return;
	if (!Array.isArray(currentNode.value.children)) {
		currentNode.value.children = [];
	}

	if (currentNode.value.children.length === 0 && props.hasChildren?.(currentNode.value)) {
		emit("loadChildren", currentNode.value);
	}

	expanded.value = true;
}

function handleRemove() {
	if (!currentNode.value) return;
	emit("removeTag", currentNode.value);
}

const currentNode = ref<TagNode | null | undefined>(null);

watch(
	() => props.node,
	(newNode) => {
		currentNode.value = newNode;
	},
	{ immediate: true },
);
</script>

<template>
	<div class="inline-flex items-center">
		<div
			id="hello"
			class="inline-flex items-center rounded p-1"
			:style="{ 'background-color': props.colors[props.depth]?.color }"
		>
			<div class="inline-flex items-center gap-2">
				<div class="inline-flex items-center gap-1 px-2 py-1 rounded bg-primary text-white text-sm">
					<span class="pr-4">{{ currentNode?.label }}</span>

					<!-- Remove -->
					<button class="hover:opacity-80" @click="handleRemove">
						<XIcon :size="14" />
					</button>
				</div>

				<!-- Expand/Load children -->
				<button
					:class="`${props.hasChildren ? `hover:text-white` : `disabled:opacity-50`}`"
					:disabled="!(props.hasChildren && currentNode && props.hasChildren(currentNode))"
					@click="
						handleLoadChildren();
						activateDropZone();
					"
				>
					<PlusCircleIcon :size="16" />
				</button>
			</div>
			<!-- Expand/Load children -->
			<div v-if="expanded && currentNode != null" class="ml-1">
				<div v-if="expanded && currentNode">
					<TagDropZone
						v-model="currentNode.children"
						:depth="props.depth + 1"
						:group-name="`tags-${currentNode?.value}`"
						:has-children="props.hasChildren"
						:is-active-drop-zone="isActiveDropZone"
						:legend="props.colors"
						:load-children="props.loadChildren"
						@load-current-children="$emit('loadChildren', $event)"
						@remove-current="$emit('removeTag', $event)"
					/>
				</div>
			</div>
		</div>
	</div>
</template>
