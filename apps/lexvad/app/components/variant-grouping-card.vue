<script setup lang="ts">
import { PlusIcon, UngroupIcon } from "@lucide/vue";
import Draggable from "vuedraggable";

import type { VariantGroup } from "@/composables/use-variant-groups";

const props = defineProps<{
	data: Array<{ id: string; label: string; value: number; secondary?: string }>;
	variants: Array<{ label: string; abs: number }>;
	title?: string;
	colors: Record<string, string>;
}>();

const groups = defineModel<Array<VariantGroup>>("groups", { required: true });

const t = useTranslations();
const { groupDisplayLabel } = useVariantGroups();

const uid = useId();
const variantsDragGroup = `grouping-variants-${uid}`;
const NEW_GROUP_TARGET = "new-group";

const entryById = computed(() => Object.fromEntries(props.data.map((entry) => [entry.id, entry])));

const countByVariant = computed(() =>
	Object.fromEntries(props.variants.map((v) => [v.label, v.abs])),
);

const staged = ref<Array<VariantGroup> | null>(null);
const current = computed(() => staged.value ?? groups.value);

watch(groups, () => {
	staged.value = null;
});

function commit(next: Array<VariantGroup>) {
	staged.value = next;
	groups.value = next;
}

const shownGroups = computed(() =>
	current.value.toSorted(
		(a, b) => (entryById.value[b.id]?.value ?? 0) - (entryById.value[a.id]?.value ?? 0),
	),
);

function entryFor(group: VariantGroup) {
	return entryById.value[group.id];
}

function setVariants(group: VariantGroup, variants: Array<string>) {
	const claimed = new Set(variants);
	commit(
		current.value.map((g) =>
			g.id === group.id
				? { ...g, variants }
				: { ...g, variants: g.variants.filter((v) => !claimed.has(v)) },
		),
	);
}

function ungroup(group: VariantGroup) {
	commit(current.value.filter((g) => g.id !== group.id));
}

const newGroupZone = ref<Array<string>>([]);

function onRemoveFromGroup() {
	newGroupZone.value = [];
}

const dropTargetId = ref<string | null>(null);
const isDragging = ref(false);

function onMove(event: { from: HTMLElement; to: HTMLElement }) {
	dropTargetId.value = event.to === event.from ? null : (event.to.dataset.groupId ?? null);
	// Anything but `false` keeps the drop allowed
	return true;
}

function clearDropTarget() {
	isDragging.value = false;
	dropTargetId.value = null;
}

const editedGroupId = ref<string | null>(null);
const editedLabel = ref("");

const labelInput = useTemplateRef<HTMLInputElement | Array<HTMLInputElement>>("labelInput");

function startRenaming(group: VariantGroup) {
	editedGroupId.value = group.id;
	editedLabel.value = groupDisplayLabel(group);
	void nextTick(() => {
		const input = labelInput.value;
		(Array.isArray(input) ? input[0] : input)?.select();
	});
}

function commitRenaming(group: VariantGroup) {
	if (editedGroupId.value !== group.id) return;
	const label = editedLabel.value.trim();
	commit(
		current.value.map((g) =>
			g.id === group.id ? { ...g, label: label.length > 0 ? label : undefined } : g,
		),
	);
	editedGroupId.value = null;
}
</script>

<template>
	<div class="rounded-lg p-3.5 border">
		<div class="uppercase font-semibold text-muted-foreground text-xs">
			{{ title ?? t("VariantGroupingCard.title") }}
		</div>

		<div
			v-for="group in shownGroups"
			:key="group.id"
			class="-mx-1 rounded-sm px-1"
			:class="dropTargetId === group.id ? 'border border-dashed border-muted-foreground/40' : ''"
		>
			<VariantBar
				v-if="group.variants.length > 1"
				:color="colors[group.id]"
				:secondary="entryFor(group)?.secondary"
				:value="entryFor(group)?.value ?? 0"
			>
				<template #label>
					<input
						v-if="editedGroupId === group.id"
						ref="labelInput"
						v-model="editedLabel"
						class="min-w-0 flex-1 rounded-sm border border-input bg-background px-1 font-semibold"
						:placeholder="t('VariantGroupingCard.group-name')"
						@blur="commitRenaming(group)"
						@keydown.enter="commitRenaming(group)"
						@keydown.esc="editedGroupId = null"
					/>
					<button
						v-else
						class="truncate font-semibold"
						:title="t('VariantGroupingCard.rename')"
						type="button"
						@click="startRenaming(group)"
					>
						{{ groupDisplayLabel(group) }}
					</button>
				</template>
				<template #actions>
					<button
						class="text-muted-foreground hover:text-foreground"
						:title="t('VariantGroupingCard.ungroup')"
						type="button"
						@click="ungroup(group)"
					>
						<UngroupIcon class="size-3" />
						<span class="sr-only">{{ t("VariantGroupingCard.ungroup") }}</span>
					</button>
				</template>
			</VariantBar>

			<Draggable
				:animation="150"
				:class="group.variants.length > 1 ? 'mb-2 pl-3' : ''"
				:data-group-id="group.id"
				:group="{ name: variantsDragGroup }"
				:item-key="(variant: string) => variant"
				:model-value="group.variants"
				:move="onMove"
				:sort="false"
				tag="div"
				@end="clearDropTarget"
				@start="isDragging = true"
				@update:model-value="(variants: Array<string>) => setVariants(group, variants)"
			>
				<template #item="{ element: variant }">
					<div class="cursor-grab">
						<div v-if="group.variants.length > 1" class="my-0.5 flex items-center gap-2 text-xs">
							<span
								class="rounded-full size-2 inline-block shrink-0 opacity-60"
								:style="{ backgroundColor: colors[group.id] }"
							></span>
							<span class="truncate">{{ variant }}</span>
							<span class="ml-auto shrink-0 text-muted-foreground">
								{{ countByVariant[variant] ?? 0 }}
							</span>
						</div>
						<VariantBar
							v-else
							:color="colors[group.id]"
							:secondary="entryFor(group)?.secondary"
							:value="entryFor(group)?.value ?? 0"
						>
							<template #label>
								<span class="truncate">{{ variant }}</span>
							</template>
						</VariantBar>
					</div>
				</template>
			</Draggable>
		</div>

		<div
			class="relative rounded-sm transition-all duration-200"
			:class="isDragging ? 'mt-2 border border-dashed border-muted-foreground/40' : 'border-0'"
			:title="t('VariantGroupingCard.new-group-hint')"
		>
			<span
				v-if="isDragging"
				class="pointer-events-none absolute inset-0 flex items-center justify-center gap-1 px-2 text-xs text-muted-foreground"
			>
				<PlusIcon class="size-3" />
				{{ t("VariantGroupingCard.new-group") }}
			</span>
			<Draggable
				:animation="150"
				:class="isDragging ? 'h-8' : 'h-0'"
				:data-group-id="NEW_GROUP_TARGET"
				:group="{ name: variantsDragGroup, pull: false, put: true }"
				:item-key="(variant: string) => variant"
				:list="newGroupZone"
				:move="onMove"
				tag="div"
				@change="onRemoveFromGroup"
				@end="clearDropTarget"
			>
				<!-- a dropped variant only lives here until `onRemoveFromGroup` clears it -->
				<template #item="{ element: variant }">
					<span class="hidden">{{ variant }}</span>
				</template>
			</Draggable>
		</div>
	</div>
</template>
