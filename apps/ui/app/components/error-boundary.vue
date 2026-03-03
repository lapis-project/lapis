<script lang="ts" setup></script>

<template>
	<NuxtErrorBoundary>
		<slot />

		<template #error="{ error }">
			<div class="relative">
				<Centered>
					<p>Error: {{ error }}</p>
				</Centered>
			</div>
		</template>
	</NuxtErrorBoundary>
</template>
