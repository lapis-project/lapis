<script lang="ts" setup>
// const props = defineProps<{
// 	title?: string;
// 	preview?: string;
// 	image?: string;
// 	alias?: string;
// }>();
</script>

<template>
	<div class="w-1/4 rounded-lg border bg-white shadow dark:border-neutral-700 dark:bg-neutral-800">
		<NuxtImg class="aspect-[16/10] rounded-t-lg" src="/images/posts/example-1-cropped.jpg" />
		<div class="p-5 dark:text-neutral-100">
			<p
				class="mb-2 inline-block rounded-full bg-secondary px-2.5 py-1 text-sm font-bold dark:bg-neutral-600"
			>
				Kartenkommentar
			</p>
			<ProseA href="/articles/backenzahn">
				<h5 class="text-surface mb-2 text-2xl font-bold leading-tight tracking-tight">
					Backenzahn
				</h5>
			</ProseA>
			<p class="text-surface mb-3 font-normal">
				Here are the biggest enterprise technology acquisitions of 2021 so far, in reverse
				chronological order.
			</p>
			<div class="text-right">
				<ProseA class="" href="/articles/backenzahn">
					Read more
					<!-- <ArrowRightIcon class="inline size-4" /> -->
				</ProseA>
			</div>
		</div>
	</div>
</template>
