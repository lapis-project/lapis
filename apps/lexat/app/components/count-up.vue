<script lang="ts" setup>
const props = defineProps<{
	value: number;
	duration?: number;
	format?: (value: number) => string;
}>();

const { count, elementRef } = useCountUp(props.value, props.duration || 1000);
</script>

<template>
	<span ref="elementRef">{{ props.format ? props.format(count) : count }}</span>
</template>
