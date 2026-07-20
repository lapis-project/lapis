<script lang="ts" setup>
import { X } from "@lucide/vue";

const t = useTranslations();
const { allQuestions, getValuesForQuestion } = useQuestions();

const splitMode = ref(false);
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
	<div class="flex min-h-0">
		<div class="flex-1 min-w-0">
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
					<UButton
						class="absolute right-0 top-0 size-6 p-1 m-1 text-muted-foreground"
						variant="ghost"
						@click="() => {splitMode = false}"
					>
						<X></X>
						<span class="sr-only">{{ t("MapsPage.controls.close-split-view") }}</span>
					</UButton>
				</template>
			</div>
		</div>

		<AppSidebar
			v-model:open="sidebarOpen"
			:active-question="activeQuestion"
			:active-variant="activeVariant"
		></AppSidebar>
	</div>
</template>
