<script setup lang="ts">
import { Check, Link, Mail } from "lucide-vue-next";

const props = defineProps<{
	title: string;
}>();

const url = ref("");
const copied = ref(false);

onMounted(() => {
	url.value = window.location.href;
});

const shareLinks = computed(() => {
	const encodedUrl = encodeURIComponent(url.value);
	const encodedTitle = encodeURIComponent(props.title);

	return {
		mail: `mailto:?subject=${encodedTitle}&body=${encodedUrl}`,
		facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
		bluesky: `https://bsky.app/intent/compose?text=${encodedTitle}%20${encodedUrl}`,
		whatsapp: `whatsapp://send?text=${encodedUrl}`,
	};
});

const copyToClipboard = async () => {
	try {
		await navigator.clipboard.writeText(url.value);
		copied.value = true;
		setTimeout(() => (copied.value = false), 2000);
	} catch (err) {
		console.error("Failed to copy", err);
	}
};
</script>

<template>
	<div class="flex flex-row items-center gap-2">
		<Button size="icon" variant="outline">
			<a aria-label="Share on Facebook" :href="shareLinks.facebook" target="_blank">
				<svg class="size-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
					<path
						d="M9.101 23.691v-7.98H6.627v-3.667h2.474v-1.58c0-4.085 1.848-5.978 5.858-5.978c.401 0 .955.042 1.468.103a9 9 0 0 1 1.141.195v3.325a9 9 0 0 0-.653-.036a27 27 0 0 0-.733-.009c-.707 0-1.259.096-1.675.309a1.7 1.7 0 0 0-.679.622c-.258.42-.374.995-.374 1.752v1.297h3.919l-.386 2.103l-.287 1.564h-3.246v8.245C19.396 23.238 24 18.179 24 12.044c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.628 3.874 10.35 9.101 11.647"
						fill="currentColor"
					/>
				</svg>
			</a>
		</Button>

		<Button size="icon" variant="outline">
			<a aria-label="Share on Bluesky" :href="shareLinks.bluesky" target="_blank">
				<svg class="size-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
					<path
						d="M5.202 2.857C7.954 4.922 10.913 9.11 12 11.358c1.087-2.247 4.046-6.436 6.798-8.501C20.783 1.366 24 .213 24 3.883c0 .732-.42 6.156-.667 7.037c-.856 3.061-3.978 3.842-6.755 3.37c4.854.826 6.089 3.562 3.422 6.299c-5.065 5.196-7.28-1.304-7.847-2.97c-.104-.305-.152-.448-.153-.327c0-.121-.05.022-.153.327c-.568 1.666-2.782 8.166-7.847 2.97c-2.667-2.737-1.432-5.473 3.422-6.3c-2.777.473-5.899-.308-6.755-3.369C.42 10.04 0 4.615 0 3.883c0-3.67 3.217-2.517 5.202-1.026"
						fill="currentColor"
					/>
				</svg>
			</a>
		</Button>

		<Button class="sm:hidden" size="icon" variant="outline">
			<a aria-label="Share on Whatsapp" :href="shareLinks.whatsapp" target="_blank">
				<svg class="size-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
					<path
						d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967c-.273-.099-.471-.148-.67.15c-.197.297-.767.966-.94 1.164c-.173.199-.347.223-.644.075c-.297-.15-1.255-.463-2.39-1.475c-.883-.788-1.48-1.761-1.653-2.059c-.173-.297-.018-.458.13-.606c.134-.133.298-.347.446-.52s.198-.298.298-.497c.099-.198.05-.371-.025-.52s-.669-1.612-.916-2.207c-.242-.579-.487-.5-.669-.51a13 13 0 0 0-.57-.01c-.198 0-.52.074-.792.372c-.272.297-1.04 1.016-1.04 2.479c0 1.462 1.065 2.875 1.213 3.074s2.096 3.2 5.077 4.487c.709.306 1.262.489 1.694.625c.712.227 1.36.195 1.871.118c.571-.085 1.758-.719 2.006-1.413s.248-1.289.173-1.413c-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214l-3.741.982l.998-3.648l-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884c2.64 0 5.122 1.03 6.988 2.898a9.82 9.82 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.82 11.82 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.9 11.9 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.82 11.82 0 0 0-3.48-8.413"
						fill="currentColor"
					/>
				</svg>
			</a>
		</Button>

		<Button size="icon" variant="outline">
			<a aria-label="Share via Email" :href="shareLinks.mail">
				<Mail class="size-5" />
			</a>
		</Button>

		<Button aria-label="Copy to Clipboard" size="icon" variant="outline" @click="copyToClipboard">
			<Check v-if="copied" class="size-5" />
			<Link v-else class="size-5" />
		</Button>
	</div>
</template>
