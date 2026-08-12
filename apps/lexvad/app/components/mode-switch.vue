<script setup lang="ts">
interface Option {
	value: string;
	label: string;
}
defineProps<{
	modes: Array<Option>;
}>();
</script>

<template>
	<UTabs :content="false" :items="modes" variant="pill" />
</template>
