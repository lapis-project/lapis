<script setup lang="ts">
import { List } from "@lucide/vue";

const t = useTranslations();
</script>

<template>
	<div class="rounded-lg p-3.5 border bg-card text-xs flex gap-2">
		<List class="size-3 self-center text-muted-foreground"></List>
		<span class="text-muted-foreground">{{ t("CategoryCard.category") }}:</span>
		<span class="font-semibold">{{ t("CategoryCard.noun") }}</span>
	</div>
</template>
