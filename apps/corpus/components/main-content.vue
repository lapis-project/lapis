<script lang="ts" setup>
const id = "main-content";
</script>

<template>
	<main :id="id" class="mt-14 sm:mt-16" :tabindex="-1">
		<slot />
	</main>
</template>
