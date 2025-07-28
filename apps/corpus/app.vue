<script setup lang="ts"></script>

<template>
	<NuxtRouteAnnouncer />
	<NuxtLayout>
		<NuxtPage />
		<NuxtLoadingIndicator />
		<LazyClientOnly>
			<Toaster />
		</LazyClientOnly>
	</NuxtLayout>
</template>
