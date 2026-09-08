<script lang="ts" setup>
import { X } from "@lucide/vue";

const currentQuestionnaireRound = 3;

const hasDismissedBanner = useCookie<boolean>(`banner-dismissed-${currentQuestionnaireRound}`, {
	default: () => false,
	// Make it act like local storage by persisting it for a long time (e.g., 1 year).
	// Without maxAge, it becomes a "session cookie" and resets when the browser closes.
	maxAge: 60 * 60 * 24 * 365,
	// Ensure the cookie is accessible from all pages in your app
	path: "/",
});

const showBanner = computed(() => !hasDismissedBanner.value);

function dismissBanner() {
	hasDismissedBanner.value = true;
}

const locale = useLocale();
</script>

<template>
	<Transition name="slide-fade-top">
		<div
			v-if="showBanner && locale === 'de'"
			class="sticky top-0 left-0 right-0 z-10 flex h-12 items-center justify-center gap-6 border-b border-inverted/10 bg-primary text-inverted"
		>
			<div class="flex items-center gap-2 text-sm">
				<span>🥳</span>
				<span class="font-semibold">Neu:</span>
				<span class="hidden sm:inline"
					>Die aktuelle Fragebogenrunde {{ currentQuestionnaireRound }} ist online.</span
				>
				<span class="sm:hidden">Hier geht es zur neuen Fragebogenrunde.</span>
			</div>

			<a
				class="inline-flex h-7 items-center justify-center gap-1.5 rounded-full bg-default px-3 py-1 text-xs font-medium text-default transition-colors hover:bg-elevated"
				href="https://ofb.dioe.at/index.php/59431?lang=de"
				target="_blank"
				@click="dismissBanner"
			>
				Jetzt mitmachen
				<UIcon name="i-lucide-chevron-right" class="size-3.5" />
			</a>

			<UButton
				icon="i-lucide-x"
				aria-label="Dismiss announcement"
				class="absolute top-1/2 right-4 -translate-y-1/2 text-inverted"
				@click="dismissBanner"
				variant="ghost"
			>
			</UButton>
		</div>
	</Transition>
</template>

<style scoped>
.slide-fade-top-enter-active,
.slide-fade-top-leave-active {
	transition:
		transform 0.3s ease-out,
		opacity 0.3s ease-out;
}

.slide-fade-top-enter-from,
.slide-fade-top-leave-to {
	opacity: 0%;
	transform: translateY(-100%);
}
</style>
