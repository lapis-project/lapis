<script setup lang="ts">
defineProps<{
	variant: string;
	count: number;
	notations: number;
}>();

const t = useTranslations();
</script>

<template>
	<div class="rounded-lg bg-card p-3.5 border">
		<div class="uppercase font-semibold text-muted-foreground text-xs">
			{{ t("SelectedVariantCard.title") }}
		</div>
		<div class="uppercase font-bold text-lg mt-1 mb-2">
			<span class="size-3 inline-block rounded-full bg-amber-600 mr-2"></span>{{ variant }}
		</div>
		<div class="flex w-full justify-stretch gap-4">
			<div class="rounded-lg bg-background p-2 px-3 w-full border">
				<div class="font-semibold text-muted-foreground text-xs">
					{{ t("SelectedVariantCard.mentions") }}
				</div>
				<div class="font-semibold text-lg">
					{{ count }}
				</div>
			</div>
			<div class="rounded-lg bg-background p-2 px-3 w-full border">
				<div class="font-semibold text-muted-foreground text-xs">
					{{ t("SelectedVariantCard.notations") }}
				</div>
				<div class="font-semibold text-lg">
					{{ notations }}
				</div>
			</div>
		</div>
	</div>
</template>
