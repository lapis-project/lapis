<script setup lang="ts">
defineProps<{
	icon?: string;
	title?: string;
	links?: Array<{ label: string; to: string }>;
}>();
</script>

<template>
	<UCard
		class="not-prose w-full text-center flex flex-col items-center"
		:ui="{ root: 'divide-none' }"
		variant="soft"
	>
		<template #header>
			<div class="flex flex-col items-center gap-4">
				<UIcon v-if="icon" class="w-16 h-16 text-primary shrink-0" :name="icon" />
			</div>
		</template>
		<h3 v-if="title" class="text-xl font-bold">
			{{ title }}
		</h3>

		<template v-if="links && links.length" #footer>
			<div class="flex flex-col items-center gap-2">
				<UButton
					v-for="(link, index) in links"
					:key="index"
					:label="link.label"
					:padded="false"
					target="_blank"
					:to="link.to"
					variant="link"
				/>
			</div>
		</template>
	</UCard>
</template>
