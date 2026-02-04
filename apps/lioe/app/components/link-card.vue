<script lang="ts" setup>
const props = defineProps<{
	title: string;
	description: string;
	content: string;
	action: string;
	link: string;
}>();

const t = useTranslations();
</script>

<template>
	<UCard class="flex items-center flex-col" variant="outline">
		<template #header>
			<h3 class="text-lg font-medium">{{ t(props.title) }}</h3>
			<p class="text-sm h-10">{{ t(props.description) }}</p>
		</template>

		<p class="text-sm">{{ t(props.content) }}</p>

		<template #footer>
			<UButton id="follow-link" target="_blank" :to="t(props.link)" variant="outline">
				{{ t(props.action) }}
			</UButton>
		</template>
	</UCard>
</template>
