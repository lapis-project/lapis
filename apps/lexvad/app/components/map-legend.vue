<script lang="ts" setup>
import { PlusIcon, UngroupIcon } from "@lucide/vue";
import Draggable from "vuedraggable";

export interface LegendGroup {
	id: string;
	label?: string;
	variants: Array<string>;
}

export interface LegendVariant {
	label: string;
	count: number;
}

const props = defineProps<{
	question: string;
	variants: Array<LegendVariant>;
	activeVariants: Array<string>;
}>();

const groups = defineModel<Array<LegendGroup>>("groups", { required: true });

const t = useTranslations();
const { getColorForVariant } = useColorStore();

const uid = useId();
const groupsDragGroup = `legend-groups-${uid}`;
const variantsDragGroup = `legend-variants-${uid}`;

let lastGroupId = 0;
function createGroup(variants: Array<string>): LegendGroup {
	lastGroupId += 1;
	return { id: `${uid}-${String(lastGroupId)}`, variants };
}

watch(
	() => props.variants,
	() => {
		const known = new Set(props.variants.map((v) => v.label));
		const synced = groups.value
			.map((group) => ({ ...group, variants: group.variants.filter((v) => known.has(v)) }))
			.filter((group) => group.variants.length > 0);
		const grouped = new Set(synced.flatMap((group) => group.variants));
		props.variants.forEach((v) => {
			if (!grouped.has(v.label)) synced.push(createGroup([v.label]));
		});
		groups.value = synced;
	},
	{ immediate: true },
);

const countByVariant = computed(() => {
	return Object.fromEntries(props.variants.map((v) => [v.label, v.count]));
});

function variantCount(variant: string) {
	return countByVariant.value[variant] ?? 0;
}

function groupCount(group: LegendGroup) {
	return group.variants.reduce((sum, variant) => sum + variantCount(variant), 0);
}

function groupColor(group: LegendGroup) {
	return getColorForVariant(props.question, group.variants[0] ?? "") ?? "transparent";
}

function groupLabel(group: LegendGroup) {
	return group.label ?? group.variants.join(" / ");
}

function isVisible(variant: string) {
	return props.activeVariants.length === 0 || props.activeVariants.includes(variant);
}

function isGroupVisible(group: LegendGroup) {
	return group.variants.some(isVisible);
}

function pruneGroups() {
	const remaining = groups.value.filter((group) => group.variants.length > 0);
	if (remaining.length !== groups.value.length) groups.value = remaining;
}

function onVariantsChange() {
	void nextTick(pruneGroups);
}

const newGroupZone = ref<Array<string>>([]);

const NEW_GROUP_TARGET = "new-group";

const dropTargetId = ref<string | null>(null);
const isDragging = ref(false);

function onMove(event: { from: HTMLElement; to: HTMLElement }) {
	dropTargetId.value = event.to === event.from ? null : (event.to.dataset.groupId ?? null);
	// Anything but `false` keeps the drop allowed.
	return true;
}

function clearDropTarget() {
	isDragging.value = false;
	dropTargetId.value = null;
}

function onNewGroup() {
	const [variant] = newGroupZone.value;
	newGroupZone.value = [];
	if (variant == null) return;
	groups.value.push(createGroup([variant]));
	pruneGroups();
}

function ungroup(group: LegendGroup) {
	const index = groups.value.findIndex((g) => g.id === group.id);
	if (index === -1) return;
	groups.value.splice(index, 1, ...group.variants.map((variant) => createGroup([variant])));
}

const editedGroupId = ref<string | null>(null);
const editedLabel = ref("");
const labelInput = useTemplateRef<HTMLInputElement>("labelInput");

function startRenaming(group: LegendGroup) {
	editedGroupId.value = group.id;
	editedLabel.value = groupLabel(group);
	void nextTick(() => {
		labelInput.value?.select();
	});
}

function commitRenaming(group: LegendGroup) {
	if (editedGroupId.value !== group.id) return;
	const label = editedLabel.value.trim();
	group.label = label.length > 0 ? label : undefined;
	editedGroupId.value = null;
}
</script>

<template>
	<div
		class="rounded-md border border-input bg-background p-3 text-xs text-foreground shadow-md"
		data-testid="variantLegend"
	>
		<p class="mb-2 font-semibold uppercase text-muted-foreground sr-only">
			{{ t("MapsPage.legend.title") }}
		</p>

		<Draggable
			v-model="groups"
			:animation="150"
			class="space-y-1"
			:group="{ name: groupsDragGroup }"
			item-key="id"
			:sort="false"
			tag="ul"
		>
			<template #item="{ element: group }">
				<li
					class="-mx-1 rounded-sm px-1"
					:class="[
						group.variants.length > 1 && false
							? 'border border-dashed border-muted-foreground/40 p-1'
							: '',
						isGroupVisible(group) ? '' : 'hidden',
						dropTargetId === group.id
							? 'rounded-sm border border-dashed border-muted-foreground/40'
							: '',
					]"
				>
					<div v-if="group.variants.length > 1" class="flex items-center justify-between gap-4">
						<div class="flex min-w-0 items-center gap-2">
							<div
								class="size-2 shrink-0 rounded-full"
								:style="{ backgroundColor: groupColor(group) }"
							></div>
							<input
								v-if="editedGroupId === group.id"
								ref="labelInput"
								v-model="editedLabel"
								class="w-32 rounded-sm border border-input bg-background px-1 font-semibold"
								:placeholder="t('MapsPage.legend.group-name')"
								@blur="commitRenaming(group)"
								@keydown.enter="commitRenaming(group)"
								@keydown.esc="editedGroupId = null"
							/>
							<button
								v-else
								class="truncate font-semibold max-w-24"
								:title="t('MapsPage.legend.rename')"
								type="button"
								@click="startRenaming(group)"
							>
								{{ groupLabel(group) }}
							</button>
						</div>
						<div class="flex items-center gap-1">
							<span class="text-muted-foreground">{{ groupCount(group) }}</span>
							<button
								class="text-muted-foreground hover:text-foreground"
								:title="t('MapsPage.legend.ungroup')"
								type="button"
								@click="ungroup(group)"
							>
								<UngroupIcon class="size-3" />
								<span class="sr-only">{{ t("MapsPage.legend.ungroup") }}</span>
							</button>
						</div>
					</div>
					<Draggable
						:animation="150"
						class="space-y-0.5"
						:class="group.variants.length > 1 ? 'mt-1 pl-3' : ''"
						:data-group-id="group.id"
						:group="{ name: variantsDragGroup }"
						:item-key="(variant: string) => variant"
						:list="group.variants"
						:move="onMove"
						:sort="false"
						tag="ul"
						@change="onVariantsChange"
						@end="clearDropTarget"
						@start="isDragging = true"
					>
						<template #item="{ element: variant }">
							<li
								class="flex cursor-grab items-center justify-between gap-4"
								:class="isVisible(variant) ? '' : 'hidden'"
							>
								<div class="flex gap-2">
									<div
										class="size-2 self-center rounded-full"
										:style="{ backgroundColor: groupColor(group) }"
									></div>
									<span>{{ variant }}</span>
								</div>
								<span class="text-muted-foreground">{{ variantCount(variant) }}</span>
							</li>
						</template>
					</Draggable>
				</li>
			</template>
		</Draggable>
		<div
			class="relative rounded-sm"
			:class="isDragging ? ' mt-2  border border-dashed border-muted-foreground/40' : 'border-0'"
			:title="t('MapsPage.legend.new-group-hint')"
		>
			<span
				v-if="isDragging"
				class="pointer-events-none absolute inset-0 flex items-center justify-center gap-1 px-2 text-muted-foreground"
			>
				<PlusIcon class="size-3" />
				{{ t("MapsPage.legend.new-group") }}
			</span>
			<Draggable
				:animation="150"
				class="transition-all duration-200"
				:class="isDragging ? 'h-8' : 'h-0'"
				:data-group-id="NEW_GROUP_TARGET"
				:group="{ name: variantsDragGroup, pull: false, put: true }"
				:item-key="(variant: string) => variant"
				:list="newGroupZone"
				:move="onMove"
				tag="div"
				@change="onNewGroup"
				@end="clearDropTarget"
			>
				<!-- A dropped variant only lives here until `onNewGroup` moves it into a group. -->
				<template #item="{ element: variant }">
					<span class="hidden">{{ variant }}</span>
				</template>
			</Draggable>
		</div>
	</div>
</template>
