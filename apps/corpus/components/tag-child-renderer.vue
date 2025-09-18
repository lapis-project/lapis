<script setup lang="ts">
import { PlusCircleIcon, XIcon } from "lucide-vue-next";

interface TagNode {
	value: number;
	label: string;
	children: Array<TagNode>;
}

const props = defineProps<{
	node: TagNode | null | undefined;
	loadChildren: (node: TagNode) => Array<TagNode>;
	hasChildren?: (node: TagNode) => boolean;
	depth?: number;
}>();

const emit = defineEmits<{
	(e: "removeTag", node: TagNode): void;
	(e: "loadChildren", node: TagNode): void;
}>();

const depth = computed(() => props.depth ?? 0);
const expanded = ref(false);
const currentNode = ref<TagNode | null>();

const isActiveDropZone = ref(false);

function activateDropZone() {
	isActiveDropZone.value = true;
}

function deactivateDropZone() {
	isActiveDropZone.value = false;
}

function handleLoadChildren() {
	if (!currentNode.value || !props.loadChildren) return;

	if (!Array.isArray(currentNode.value.children)) {
		currentNode.value.children = [];
	}

	if (currentNode.value.children.length === 0 && props.hasChildren) {
		emit("loadChildren", currentNode.value);
	}

	expanded.value = true;
}

function handleRemove() {
	if (!currentNode.value) return;
	emit("removeTag", currentNode.value);
}

watch(
	() => {
		return props.node;
	},
	() => {
		currentNode.value = props.node;
	},
	{ immediate: true },
);
</script>

<template>
	<div class="inline-flex ml-2 mt-1 items-center">
		<div id="hello" class="inline-flex items-center rounded p-1 mb-2 bg-accent-foreground">
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
					:class="`${props.hasChildren ? `hover:text-accent-foreground` : `disabled:opacity-50`}`"
					:disabled="!props.hasChildren"
					@click="
						handleLoadChildren();
						activateDropZone();
					"
				>
					<PlusCircleIcon :size="16" />
				</button>
			</div>

			<div v-if="expanded && currentNode != null" class="ml-1">
				<div v-if="expanded && currentNode" class="ml-6">
					<TagDropZone
						v-model="currentNode.children"
						:depth="depth + 1"
						:group-name="`tags-${currentNode?.value}`"
						:is-active-drop-zone="isActiveDropZone"
						:load-children="props.loadChildren"
					/>
				</div>
			</div>
		</div>
	</div>
</template>
