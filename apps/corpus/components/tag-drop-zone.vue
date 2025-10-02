<script setup lang="ts">
import Draggable from "vuedraggable";

export interface TagNode {
	value: number;
	label: string;
	children: Array<TagNode>;
	raw?: {
		tag_id: number;
		tag_abbrev: string;
		tag_gene: number;
		tag_name: string;
		tag_ebene_name: string;
		tag_ebene_id: number;
		children_ids: string;
		parent_ids: Array<number>;
	};
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
	console.log("active dropzone: ", (props.isRoot ?? false) || props.isActiveDropZone);
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
		class="flex flex-row gap-2 items-start transition-all duration-300 border rounded border-black h-full"
		:group="{
			name: props.groupName,
			pull: false,
			put: (to, from) => {
				console.log('hello from put: ', from?.options?.group?.name, props.groupName);
				return activeZone && from?.options?.group?.name === props.groupName;
			},
		}"
		item-key="value"
		:list="props.modelValue"
		@update:model-value="
			emit('update:modelValue', $event);
			activeZone && (activeZone = false);
		"
	>
		<template #item="{ element }">
			<TagChildRenderer
				class="transition-transform duration-300"
				:depth="props.depth ?? 0"
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
				:class="props.groupName == 'tags-root' ? 'text-muted-foreground' : 'text-white'"
			>
				Tag hinzufügen...
			</div>
		</template>
	</Draggable>
</template>
