<script setup lang="ts">
import type { DropdownOption } from "@/types/dropdown-option";

const t = useTranslations();

const props = defineProps<{
	id?: string;
	options: Array<DropdownOption>;
	placeholder: string;
	moveable?: boolean;
}>();

const modelValue = defineModel<Array<string>>({ default: () => [] });
const selectedOption = ref<string>();
const searchTerm = ref("");

const availableOptions = computed(() => {
	return props.options.flatMap((option) => {
		if (!option.label || modelValue.value.includes(option.label)) {
			return [];
		}

		return [{ label: option.label, value: option.label }];
	});
});

const addItem = (value: string | undefined) => {
	if (!value || modelValue.value.includes(value)) {
		return;
	}

	modelValue.value = [...modelValue.value, value];
};

watch(selectedOption, (value) => {
	if (!value) {
		return;
	}

	addItem(value);
	nextTick(() => {
		selectedOption.value = undefined;
		searchTerm.value = "";
	});
});

const removeItem = (item: string) => {
	modelValue.value = modelValue.value.filter((value) => value !== item);
};

const moveItem = (index: number, direction: "up" | "down") => {
	const targetIndex = direction === "up" ? index - 1 : index + 1;

	if (targetIndex < 0 || targetIndex >= modelValue.value.length) {
		return;
	}

	const reorderedItems = [...modelValue.value];
	[reorderedItems[index], reorderedItems[targetIndex]] = [
		reorderedItems[targetIndex]!,
		reorderedItems[index]!,
	];
	modelValue.value = reorderedItems;
};
</script>

<template>
	<div class="space-y-3">
		<UInputMenu
			:id="props.id"
			v-model="selectedOption"
			v-model:search-term="searchTerm"
			class="w-full"
			icon="i-lucide-search"
			:items="availableOptions"
			:placeholder="t('TagsCombobox.button', { placeholder: props.placeholder })"
			size="lg"
			value-key="value"
		>
			<template #empty>
				{{ t("TagsCombobox.empty") }}
			</template>
		</UInputMenu>

		<div v-if="modelValue.length" class="overflow-hidden rounded-lg border border-default">
			<div v-if="moveable && modelValue.length > 1" class="flex gap-2 bg-elevated/50 px-3 py-2">
				<UIcon class="mt-0.5 size-4 shrink-0 text-muted" name="i-lucide-info" />
				<p class="text-xs text-muted">{{ t("TagsCombobox.order_hint") }}</p>
			</div>

			<ol class="divide-y divide-default">
				<li v-for="(item, index) in modelValue" :key="item" class="flex items-center gap-3 p-3">
					<UBadge color="neutral" size="sm" variant="subtle">
						{{ index + 1 }}
					</UBadge>
					<span class="min-w-0 grow truncate text-sm font-medium text-highlighted">
						{{ item }}
					</span>

					<div class="flex items-center gap-1">
						<UButton
							v-if="moveable && index > 0"
							:aria-label="t('TagsCombobox.move_up', { item })"
							color="neutral"
							icon="i-lucide-arrow-up"
							size="xs"
							variant="ghost"
							@click="moveItem(index, 'up')"
						/>
						<UButton
							v-if="moveable && index < modelValue.length - 1"
							:aria-label="t('TagsCombobox.move_down', { item })"
							color="neutral"
							icon="i-lucide-arrow-down"
							size="xs"
							variant="ghost"
							@click="moveItem(index, 'down')"
						/>
						<UButton
							:aria-label="t('TagsCombobox.remove', { item })"
							color="error"
							icon="i-lucide-x"
							size="xs"
							variant="ghost"
							@click="removeItem(item)"
						/>
					</div>
				</li>
			</ol>
		</div>
	</div>
</template>
