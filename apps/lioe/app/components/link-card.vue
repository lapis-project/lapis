<script lang="ts" setup>
const props = defineProps<{
	title: string;
	description: string;
	content: string;
	action: string;
}>();

const t = useTranslations();
</script>

<template>
	<Card>
		<CardHeader>
			<CardTitle>{{ t(props.title) }}</CardTitle>
			<CardDescription>{{ t(props.description) }}</CardDescription>
		</CardHeader>
		<CardContent>{{ t(props.content) }}</CardContent>
		<CardFooter>
			<CardAction>
				<Button id="follow-link" variant="outline">{{ t(props.action) }}</Button>
			</CardAction>
		</CardFooter>
	</Card>
</template>
