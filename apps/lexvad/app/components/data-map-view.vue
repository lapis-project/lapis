<script lang="ts" setup>
import { X } from "@lucide/vue";

const t = useTranslations();
const { allQuestions, getValuesForQuestion } = useQuestions();

const splitMode = ref(true);
const sidebarOpen = ref(false);

const activeQuestion = ref<string>(allQuestions[0] ?? "Gießkanne");
const activeVariant = ref<string>(getValuesForQuestion(activeQuestion.value)[0] ?? "");

function updateSidebar(question: string, variant?: string) {
	const selectedVariant = variant ?? getValuesForQuestion(question)[0] ?? "";
	if (!sidebarOpen.value) {
		activeQuestion.value = question;
		activeVariant.value = selectedVariant;
		sidebarOpen.value = true;
		return;
	}
	if (activeQuestion.value !== question || activeVariant.value !== selectedVariant) {
		activeQuestion.value = question;
		activeVariant.value = selectedVariant;
		return;
	}
	sidebarOpen.value = false;
}
</script>

<template>
	<SidebarProvider
		class="min-h-0!"
		:open="sidebarOpen"
		style="--sidebar-width: 25rem"
		@update:open="sidebarOpen = $event"
	>
		<SidebarInset class="shadow-none! min-h-0!">
			<div class="flex gap-5 justify-center relative">
				<SingleMapView
					class="grow shrink"
					:split-mode="splitMode"
					@toggle-compare-mode="splitMode = true"
					@toggle-sidebar="updateSidebar"
				/>
				<template v-if="splitMode">
					<div class="divide-accent border-l h-150 self-end"></div>
					<SingleMapView
						class="grow shrink"
						:split-mode="splitMode"
						@toggle-sidebar="updateSidebar"
					/>
					<Button
						class="absolute right-0 top-0 size-6 p-1 m-1 text-muted-foreground"
						variant="ghost"
						@click="splitMode = false"
					>
						<X></X>
						<span class="sr-only">{{ t("MapsPage.controls.close-split-view") }}</span>
					</Button>
				</template>
			</div>
		</SidebarInset>

		<AppSidebar
			:active-question="activeQuestion"
			:active-variant="activeVariant"
			:open="sidebarOpen"
		></AppSidebar>
	</SidebarProvider>
</template>
