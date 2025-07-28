<script lang="ts" setup></script>

<template>
	<div class="grid min-h-full grid-rows-[auto_1fr_auto]">
		<AppHeader class="fixed top-0 left-0 right-0" />
		<ErrorBoundary>
			<slot />
		</ErrorBoundary>
	</div>
</template>
