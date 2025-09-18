<script lang="ts" setup>
import { MinusCircleIcon, PlusCircleIcon } from "lucide-vue-next";
import Draggable from "vuedraggable";

import results from "@/assets/data/test-tags.json";

import type { TagNode } from "./tag-drop-zone.vue";

const tagLayerOne = computed(() => {
	return results.results
		.filter((res) => {
			return (
				res.tag_gene === 0 &&
				activeParentLayerOption.value != null &&
				res.tag_ebene_id === parseInt(activeParentLayerOption.value)
			);
		})
		.map((r) => {
			return {
				value: r.tag_id,
				label: r.tag_abbrev,
				parentLayerName: r.tag_ebene_name,
				parentLayerId: r.tag_ebene_id,
			};
		});
});

const parentLayer = computed(() => {
	const temp: Record<number, string> = {};
	results.results.forEach((res) => {
		if (res.tag_ebene_name == null || res.tag_gene !== 0) return;
		const id: number = res.tag_ebene_id;
		temp[id] = res.tag_ebene_name;
	});
	const result = Object.entries(temp);
	return result.map((r) => {
		return { value: r[0], label: r[1] };
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

const activeParentLayerOption = ref<string | null>(null);
const activeTagLayerOneOption = ref<string | null>(null);
const tagLayerTwoActive = ref(false);
const tagLayerOneActive = ref(false);
const activeTags = ref<Array<TagNode>>([]);
const availableTagLayer = ref<Array<{ value: number; label: string }>>([]);
const parentLocked = ref(false);

function setNextLayer(layer: number) {
	switch (layer) {
		case 1:
			tagLayerOneActive.value = true;
			parentLocked.value = true;
			break;
		case 2:
			tagLayerTwoActive.value = true;
			break;
	}
}

function collapseLayer(layer: number) {
	switch (layer) {
		case 1:
			tagLayerOneActive.value = false;
			parentLocked.value = false; // unlock parent select
			activeTags.value = []; // remove all tags from this layer
			break;
		case 2:
			tagLayerTwoActive.value = false;
			// optionally remove G1 tags
			break;
	}
}

watch(
	tagLayerOne,
	(newList) => {
		availableTagLayer.value = newList.filter(
			(tag) => !activeTags.value.some((s) => s.value === tag.value),
		);
	},
	{ immediate: true },
);

watch(
	activeTags,
	(newStack) => {
		availableTagLayer.value = availableTagLayer.value.filter(
			(tag) => !newStack.some((s) => s.value === tag.value),
		);
	},
	{ immediate: true },
);

function loadChildren(node: TagNode): Array<TagNode> {
	console.log(node);
	const parentTag = results.results.find((r) => r.tag_id === node.value);
	if (!parentTag || !parentTag.children_ids) return [];

	try {
		const parsed = JSON.parse(parentTag.children_ids);
		if (!Array.isArray(parsed)) return [];

		return parsed
			.map((child: any) => {
				const fullChild = results.results.find((r) => r.tag_id === child.childtags);
				if (!fullChild) return null; // keep all children that exist
				return {
					value: fullChild.tag_id,
					label: fullChild.tag_abbrev || fullChild.tag_name || `Tag ${fullChild.tag_id}`,
					children: [],
				};
			})
			.filter(Boolean) as Array<TagNode>;
	} catch {
		return [];
	}
}

function handleLoadChildren(node: TagNode) {
	const children = loadChildren(node);

	// Add children to available list if not already in activeTags or availableTagLayer
	children.forEach((child) => {
		if (
			!activeTags.value.some((t) => t.value === child.value) &&
			!availableTagLayer.value.some((t) => t.value === child.value)
		) {
			availableTagLayer.value.push({ value: child.value, label: child.label });
		}
	});
}

function hasChildren(node: TagNode): boolean {
	const parentTag = results.results.find((r) => r.tag_id === node.value);
	if (!parentTag || !parentTag.children_ids) return false;

	try {
		const parsed = JSON.parse(parentTag.children_ids);
		if (!Array.isArray(parsed)) return false;

		return parsed.some((child: any) => {
			const fullChild = results.results.find((r) => r.tag_id === child.childtags);
			return fullChild?.tag_gene === 2; // <-- only allows gene 2
		});
	} catch {
		return false;
	}
}

function handleRemove(node: TagNode) {
	// Recursively remove node from activeTags
	function removeFromList(list: Array<TagNode>) {
		const index = list.findIndex((n) => n.value === node.value);
		if (index !== -1) {
			list.splice(index, 1);
			return true;
		}
		return list.some((child) => removeFromList(child.children));
	}

	removeFromList(activeTags.value);

	if (!availableTagLayer.value.some((t) => t.value === node.value)) {
		availableTagLayer.value.push({ ...node, children: [] });
	}
}
</script>

<template>
	<div class="grid grid-cols-2 py-4 h-full">
		<div class="flex-row flex items-center p-4 mb-auto">
			<div>
				<Label class="text-sm text-muted-foreground" for="context">Tag Ebene</Label>
				<div class="grid grid-cols-[auto_1fr] items-center">
					<BaseSelect
						id="context"
						v-model="activeParentLayerOption"
						:disabled="parentLocked"
						:options="parentLayer"
						placeholder="Tagebene wählen"
					></BaseSelect>

					<div>
						<div v-if="!tagLayerTwoActive" class="relative group inline-block">
							<Button
								v-if="activeParentLayerOption && !tagLayerOneActive"
								class="p-2 h-8 m-0"
								variant="ghost"
								@click="setNextLayer(1)"
							>
								<PlusCircleIcon :size="18" />
							</Button>

							<Button
								v-else-if="activeParentLayerOption && tagLayerOneActive"
								class="p-2 h-8 m-0 relative"
								variant="ghost"
								@click="collapseLayer(1)"
							>
								<PlusCircleIcon
									class="transition-opacity duration-200 group-hover:opacity-0 text-accent-foreground"
									:size="18"
								/>
								<MinusCircleIcon
									class="absolute justify-self-start transition-opacity duration-200 opacity-0 group-hover:opacity-100"
									:size="18"
								/>
							</Button>
						</div>
					</div>
				</div>
			</div>
			<div v-if="tagLayerOne.length > 0 && tagLayerOneActive">
				<div>
					<Label class="text-sm text-muted-foreground" for="tags">G0</Label>
					<TagDropZone
						v-model="activeTags"
						class="border border-muted-foreground rounded p-2 w-full min-w-40"
						:has-children="hasChildren"
						:is-root="true"
						:load-children="loadChildren"
						@load-current-children="handleLoadChildren"
						@remove-current="handleRemove"
					/>
				</div>
			</div>
		</div>

		<div
			v-if="tagLayerOne.length > 0 && tagLayerOneActive"
			class="justify-self-end pr-8 flex h-full flex-col"
		>
			<Label class="text-sm text-muted-foreground" for="tags">G0-Tags</Label>
			<Draggable
				id="tags"
				v-model="availableTagLayer"
				class="border border-muted-foreground rounded p-2 w-40 min-h-[100px] h-full"
				:group="{ name: 'tags', pull: true, put: false }"
				item-key="value"
			>
				<template #item="{ element }">
					<div class="cursor-move px-2 py-1 bg-muted rounded my-1">
						{{ element.label }}
					</div>
				</template>
			</Draggable>
		</div>
	</div>
</template>
