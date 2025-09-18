<script setup lang="ts">
import Draggable from "vuedraggable";

export interface TagNode {
	value: number;
	label: string;
	children: Array<TagNode>;
}

const props = defineProps<{
	modelValue: Array<TagNode>;
	loadChildren: (node: TagNode) => Array<TagNode>;
	hasChildren?: (node: TagNode) => boolean;
	depth?: number;
	groupName?: string;
	isActiveDropZone?: boolean;
	isRoot?: boolean;
}>();

const activeZone = computed(() => {
	return (props.isRoot ?? false) || props.isActiveDropZone;
});

const emit = defineEmits(["update:modelValue", "removeCurrent", "loadCurrentChildren"]);

function removeTag(node: TagNode) {
	emit("removeCurrent", node);
}

function loadCurrentChildren(node: TagNode) {
	emit("loadCurrentChildren", node);
}
</script>

<template>
	<Draggable
		class="w-full"
		:group="{ name: props.groupName, pull: true, put: activeZone }"
		item-key="value"
		:list="props.modelValue"
		@update:model-value="
			emit('update:modelValue', $event);
			activeZone && (activeZone = false);
		"
	>
		<template #item="{ element }">
			<TagChildRenderer
				:group-name="`tags-${element.value}`"
				:has-children="hasChildren"
				:load-children="props.loadChildren"
				:node="element"
				@load-children="loadCurrentChildren"
				@remove-tag="removeTag"
			/>
		</template>
		<template #footer>
			<div
				v-if="!props.modelValue.length"
				class="flex items-center justify-start text-xs text-muted-foreground"
			>
				Tags hinzufügen...
			</div>
		</template>
	</Draggable>
</template>
