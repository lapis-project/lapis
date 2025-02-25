<script lang="ts" setup>
const props = defineProps<{
	value: number;
	duration?: number;
}>();

const { count, elementRef } = useCountUp(props.value, props.duration || 1000);
</script>

<template>
	<span ref="elementRef">{{ count }}</span>
</template>
