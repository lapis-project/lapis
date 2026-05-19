<script lang="ts" setup>
import { ChevronRight, X } from "lucide-vue-next";

const currentQuestionnaireRound = 4;

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
			class="sticky top-0 left-0 right-0 z-10 flex items-center justify-center h-12 gap-6 bg-primary text-primary-foreground border-b border-border/10"
		>
			<div class="flex items-center gap-2 text-sm">
				<span>🥳</span>
				<span class="font-semibold">Neu:</span>
				<span class="hidden sm:inline"
					>Die aktuelle Fragenbogenrunde {{ currentQuestionnaireRound }} ist online.</span
				>
				<span class="sm:hidden">Hier geht es zur neuen Fragenbogenrunde.</span>
			</div>

			<a
				class="inline-flex items-center justify-center gap-1.5 h-7 px-3 py-1 text-xs font-medium rounded-full bg-primary-foreground text-primary hover:bg-muted-foreground/10 transition-colors"
				href="https://ofb.dioe.at/index.php/59431?lang=de"
				target="_blank"
				@click="dismissBanner"
			>
				Jetzt mitmachen
				<ChevronRight class="size-3.5" />
			</a>

			<button
				aria-label="Dismiss announcement"
				class="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-muted-foreground/10 transition-colors"
				@click="dismissBanner"
			>
				<X class="size-4" />
			</button>
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
