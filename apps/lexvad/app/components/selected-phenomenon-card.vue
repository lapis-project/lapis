<script setup lang="ts">
defineProps<{
	phenomenon: string;
	count: number;
	variants: number;
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
		<div class="flex w-full justify-stretch gap-4">
			<div class="rounded-lg bg-background p-2 px-3 w-full border">
				<div class="font-semibold text-muted-foreground text-xs">
					{{ t("SelectedPhenomenonCard.forms") }}
				</div>
				<div class="font-semibold text-lg">
					{{ count }}
				</div>
			</div>
			<div class="rounded-lg bg-background p-2 px-3 w-full border">
				<div class="font-semibold text-muted-foreground text-xs">
					{{ t("SelectedPhenomenonCard.variants") }}
				</div>
				<div class="font-semibold text-lg">
					{{ variants }}
				</div>
			</div>
		</div>
	</div>
</template>
