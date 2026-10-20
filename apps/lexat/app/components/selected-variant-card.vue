<script setup lang="ts">
defineProps<{
	variant: string;
	count: number;
	notations: number;
	color: string;
}>();

const t = useTranslations();
</script>

<template>
	<div class="rounded-lg bg-default p-3.5 border border-default">
		<div class="uppercase font-semibold text-muted text-xs">
			{{ t("SelectedVariantCard.title") }}
		</div>
		<div class="uppercase font-bold text-lg mt-1 mb-2">
			<span class="size-3 inline-block rounded-full mr-2" :style="{ backgroundColor: color }"></span
			>{{ variant }}
		</div>
		<div class="flex w-full justify-stretch gap-4">
			<div class="rounded-lg bg-default p-2 px-3 w-full border border-default">
				<div class="font-semibold text-muted text-xs">
					{{ t("SelectedVariantCard.mentions") }}
				</div>
				<div class="font-semibold text-lg">
					{{ count }}
				</div>
			</div>
			<!-- TODO: link this to the Belegdb later -->
			<div class="rounded-lg bg-default p-2 px-3 w-full border border-default">
				<div class="font-semibold text-muted text-xs">
					{{ t("SelectedVariantCard.notations") }}
				</div>
				<div class="font-semibold text-lg">
					{{ notations }}
				</div>
			</div>
		</div>
	</div>
</template>
