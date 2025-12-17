<script setup lang="ts">
import "vue-sonner/style.css"; // https://github.com/unovue/shadcn-vue/issues/1258#issuecomment-2901073646
</script>

<template>
	<NuxtRouteAnnouncer />
	<NuxtLayout>
		<NuxtPage />
		<NuxtLoadingIndicator />
		<Teleport to="body">
			<Toaster class="pointer-events-auto" />
		</Teleport>
	</NuxtLayout>
</template>
