<script setup lang="ts">
import type { DropdownOption } from "@/types/dropdown-option";

interface RegisterTreeItem {
	label: string;
	value: string;
	children?: Array<RegisterTreeItem>;
}

const model = defineModel<Array<string>>({ required: true });

const props = defineProps<{
	options: Array<DropdownOption>;
	placeholder?: string;
	dataTestid?: string;
}>();

const showAllOption = computed(() => {
	return props.options.find(
		(option): option is DropdownOption<string> & { label: string; value: string } =>
			option.level === 0 && typeof option.label === "string" && typeof option.value === "string",
	);
});

const treeItems = computed<Array<RegisterTreeItem>>(() => {
	return props.options.flatMap((option) => {
		if (
			option.level !== 1 ||
			typeof option.label !== "string" ||
			typeof option.value !== "string"
		) {
			return [];
		}

		const children = props.options.flatMap((child) => {
			if (
				child.level !== 2 ||
				child.group !== option.group ||
				typeof child.label !== "string" ||
				typeof child.value !== "string"
			) {
				return [];
			}

			return [{ label: child.label, value: child.value }];
		});

		return [
			{
				label: option.label,
				value: option.value,
				children,
			},
		];
	});
});

const expandedGroups = computed(() => treeItems.value.map((item) => item.value));

const selectableItems = computed(() => {
	return treeItems.value.flatMap((item) => [item, ...(item.children ?? [])]);
});

const selectableItemsByValue = computed(() => {
	return new Map(selectableItems.value.map((item) => [item.value, item]));
});

const selectedTreeItems = computed<Array<RegisterTreeItem>>({
	get() {
		if (showAllOption.value && model.value.includes(showAllOption.value.value)) {
			return [];
		}

		return model.value.flatMap((value) => {
			const item = selectableItemsByValue.value.get(value);
			return item ? [item] : [];
		});
	},
	set(selection) {
		const selectedValues = new Set(selection.map((item) => item.value));
		const everyRegisterSelected = selectableItems.value.every((item) =>
			selectedValues.has(item.value),
		);

		if (selectedValues.size === 0 || everyRegisterSelected) {
			selectAll();
			return;
		}

		model.value = selectableItems.value
			.filter((item) => selectedValues.has(item.value))
			.map((item) => item.value);
	},
});

const isShowAllSelected = computed(() => {
	return showAllOption.value ? model.value.includes(showAllOption.value.value) : false;
});

const summaryItems = computed(() => {
	if (isShowAllSelected.value) {
		return showAllOption.value ? [showAllOption.value] : [];
	}

	const selectedValues = new Set(model.value);
	return treeItems.value.flatMap((group) => {
		if (selectedValues.has(group.value)) {
			return [group];
		}

		return group.children?.filter((child) => selectedValues.has(child.value)) ?? [];
	});
});

const summaryLabel = computed(() => summaryItems.value[0]?.label ?? props.placeholder ?? "");
const additionalSelectionCount = computed(() => Math.max(0, summaryItems.value.length - 1));

function selectAll() {
	if (showAllOption.value) {
		model.value = [showAllOption.value.value];
	}
}
</script>

<template>
	<UPopover :content="{ align: 'start', sideOffset: 4 }">
		<UButton
			color="neutral"
			variant="outline"
			size="lg"
			class="w-64 justify-between"
			:data-testid="props.dataTestid"
			:aria-label="props.placeholder"
		>
			<span class="min-w-0 grow truncate text-left">{{ summaryLabel }}</span>
			<UBadge v-if="additionalSelectionCount > 0" color="neutral" variant="solid" size="sm">
				+{{ additionalSelectionCount }}
			</UBadge>
			<UIcon name="i-lucide-chevron-down" class="size-4 shrink-0 opacity-50" />
		</UButton>

		<template #content>
			<div class="w-64 p-1">
				<UButton
					v-if="showAllOption"
					color="neutral"
					variant="ghost"
					class="w-full justify-start"
					:aria-pressed="isShowAllSelected"
					@click="selectAll"
				>
					<UIcon
						name="i-lucide-check"
						class="size-4"
						:class="{ 'opacity-0': !isShowAllSelected }"
					/>
					{{ showAllOption.label }}
				</UButton>

				<USeparator v-if="showAllOption" class="my-1" />

				<UTree
					v-model="selectedTreeItems"
					:items="treeItems"
					:expanded="expandedGroups"
					:get-key="(item) => item.value"
					:as="{ link: 'div' }"
					:ui="{ linkTrailing: 'hidden' }"
					multiple
					bubble-select
					propagate-select
				>
					<template #item-leading="{ selected, indeterminate, handleSelect }">
						<UCheckbox
							:model-value="indeterminate ? 'indeterminate' : selected"
							tabindex="-1"
							@click.stop
							@update:model-value="handleSelect"
						/>
					</template>
				</UTree>
			</div>
		</template>
	</UPopover>
</template>
