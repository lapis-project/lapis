<script setup lang="ts">
import { List } from "@lucide/vue";

defineProps<{
	phenomenon: string;
	badges: Array<string>;
}>();

const t = useTranslations();
</script>

<template>
	<div class="rounded-lg bg-card p-3.5 border">
		<div class="uppercase font-semibold text-muted-foreground text-xs">
			{{ t("SelectedPhenomenonCard.title") }}
		</div>
		<div class="uppercase font-bold text-lg mt-1 mb-2">
			{{ phenomenon }}
		</div>
		<UBadge v-for="badge in badges" :key="badge" color="neutral" variant="outline"
			><List class="size-3 self-center text-muted-foreground"></List>{{ badge }}</UBadge
		>
	</div>
</template>
