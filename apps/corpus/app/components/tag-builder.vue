<script lang="ts" setup>
import { PlusCircleIcon } from "lucide-vue-next";

// import results from "@/assets/data/test-tags.json";
import results from "@/assets/data/dioe-tags-tree.json";

import type { LegendItem } from "./annotation-legend.vue";
import type { TagNode } from "./tag-drop-zone.vue";

const emit = defineEmits<{
	(e: "annotationSelected", hasAnnotation: boolean): void;
	(e: "availableTags", tags: Array<TagNode>, groupName: string): void;
}>();

const props = defineProps<{
	legend: Array<LegendItem>;
}>();

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
				children: [],
				raw: r,
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

const activeParentLayerOption = ref<string | null>(null);
const activeTags = ref<Array<TagNode>>([]);
const availableTagLayer = ref<Array<TagNode>>([]);
const parentLocked = ref(false);
const availableGroupName = ref<string>("tags-root");

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
	() => {
		return availableTagLayer.value;
	},
	() => {
		emit("availableTags", availableTagLayer.value, availableGroupName.value);
	},
);

watch(
	activeTags.value,
	(newStack) => {
		emit("annotationSelected", activeTags.value.length > 0);
		availableTagLayer.value = availableTagLayer.value.filter(
			(tag) => !newStack.some((s) => s.value === tag.value),
		);
	},
	{ immediate: true },
);

function hasChildren(node: TagNode) {
	const parentTag = node.raw ?? results.results.find((r) => r.tag_id === node.value);
	if (!parentTag || !parentTag.children_ids) return false;
	try {
		const parsed = JSON.parse(parentTag.children_ids);
		return Array.isArray(parsed) && parsed.length > 0;
	} catch {
		return false;
	}
}

function loadChildren(node: TagNode): Array<TagNode> {
	const parentTag = node.raw ?? results.results.find((r) => r.tag_id === node.value);
	if (!parentTag) return [];
	const parsed = JSON.parse(parentTag.children_ids || "[]");
	return parsed
		.map((c: any) => {
			const fullChild = results.results.find((r) => r.tag_id === c.childtags);
			if (!fullChild) return null;
			return {
				value: fullChild.tag_id,
				label: fullChild.tag_abbrev || fullChild.tag_name,
				children: [],
				raw: fullChild,
			};
		})
		.filter(Boolean);
}

function handleLoadChildren(node: TagNode) {
	const children = loadChildren(node);
	if (!children.length) return;

	availableGroupName.value = `tags-${node.value}`;
	availableTagLayer.value = [];

	children.forEach((child) => {
		if (
			!activeTags.value.some((t) => t.value === child.value) &&
			!availableTagLayer.value.some((t) => t.value === child.value)
		) {
			availableTagLayer.value.push({
				...child,
				groupName: `tags-${node.value}`,
				children: child.children ?? [],
			});
		}
	});
}

function handleRemove(node: TagNode) {
	// Recursively remove node from activeTags
	function removeFromList(list: Array<TagNode>): boolean {
		const index = list.findIndex((n) => n.value === node.value);
		if (index !== -1) {
			list.splice(index, 1);
			return true;
		}

		return list.some((child) => removeFromList(child.children));
	}

	removeFromList(activeTags.value);

	if (!availableTagLayer.value.some((t) => t.value === node.value)) {
		availableTagLayer.value.push({ ...node, children: node.children ?? [] });
	}
}
</script>

<template>
	<div class="flex relative items-center">
		<div class="flex-row flex items-center px-4 py-8">
			<div>
				<Label class="text-sm text-muted-foreground" for="context">Tag Ebene</Label>
				<div class="grid grid-cols-[auto_1fr] items-center gap-2">
					<BaseSelect
						id="context"
						v-model="activeParentLayerOption"
						:disabled="parentLocked"
						:options="parentLayer"
						placeholder="Tagebene wählen"
					></BaseSelect>

					<div>
						<div class="flex relative group">
							<PlusCircleIcon
								v-if="activeParentLayerOption"
								class="text-accent-foreground mr-2"
								:size="18"
							/>

							<!--other option: this needs review-->

							<!-- <Button
								v-if="activeParentLayerOption"
								class="p-2 h-8 m-0"
								variant="ghost"
								@click="setNextLayer(1)"
							>
								<PlusCircleIcon :size="18" />
							</Button> -->

							<!-- <Button
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
							</Button> -->
						</div>
					</div>
				</div>
			</div>
			<div v-if="activeParentLayerOption">
				<div>
					<Label class="text-sm text-muted-foreground" for="tags">Annotation</Label>
					<TagDropZone
						v-model="activeTags"
						class="border border-muted-foreground rounded p-2 w-full min-w-40"
						group-name="tags-root"
						:has-children="hasChildren"
						:is-root="true"
						:legend="props.legend"
						:load-children="loadChildren"
						@load-current-children="handleLoadChildren"
						@remove-current="handleRemove"
					/>
				</div>
			</div>
		</div>
	</div>
</template>
