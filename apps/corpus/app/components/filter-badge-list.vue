<script lang="ts" setup>
import { X } from "@lucide/vue";
const { activeFilterTagEntries, activeFilterCount, removeFilterTag, clearAllFilterTags } =
	useActiveFilterTags();
</script>

<template>
	<div v-if="activeFilterCount > 0" class="mb-4">
		<p class="text-xs text-gray-500 pb-2">Aktive Filter:</p>
		<div class="flex flex-wrap gap-2">
			<div
				v-for="tag in activeFilterTagEntries"
				:key="`${tag.key}-${tag.value}`"
				class="inline-flex shrink-0 items-center gap-1 rounded-full bg-accent-foreground px-2.5 py-1 text-xs font-medium text-white"
			>
				<span>{{ tag.label }}</span>
				<button
					type="button"
					class="inline-flex size-4 items-center justify-center rounded-full hover:bg-foreground/10"
					:aria-label="`Filter ${tag.label} entfernen`"
					@click="removeFilterTag(tag.key, tag.value)"
				>
					<X class="size-3" />
				</button>
			</div>
			<Button
				v-if="activeFilterCount > 0"
				variant="outline"
				size="sm"
				class="h-7 px-2 text-xs"
				@click="clearAllFilterTags"
			>
				Alle löschen
			</Button>
		</div>
	</div>
</template>
