<script lang="ts" setup>
import { X } from "@lucide/vue";

type MapPosition = "left" | "right";

interface SidebarState {
	open: boolean;
	question: string;
	variant: string;
}

const t = useTranslations();
const { allQuestions, getValuesForQuestion } = useQuestions();

const splitMode = ref(false);

function createSidebarState(): SidebarState {
	const question = allQuestions[0] ?? "Gießkanne";
	return {
		open: false,
		question,
		variant: getValuesForQuestion(question)[0] ?? "",
	};
}

const sidebars = reactive<Record<MapPosition, SidebarState>>({
	left: createSidebarState(),
	right: createSidebarState(),
});

function updateSidebar(position: MapPosition, question: string | null, variant?: string) {
	const sidebar = sidebars[position];
	const selectedQuestion = question ?? sidebar.question;
	const selectedVariant = variant ?? getValuesForQuestion(selectedQuestion)[0] ?? "";
	if (!sidebar.open) {
		sidebar.question = selectedQuestion;
		sidebar.variant = selectedVariant;
		sidebar.open = true;
		return;
	}
	if (sidebar.question !== selectedQuestion || sidebar.variant !== selectedVariant) {
		sidebar.question = selectedQuestion;
		sidebar.variant = selectedVariant;
		return;
	}
	sidebar.open = false;
}

function closeSplitMode() {
	splitMode.value = false;
	sidebars.right.open = false;
}
</script>

<template>
	<div class="flex min-h-0">
		<AppSidebar
			v-if="splitMode"
			v-model:open="sidebars.left.open"
			:active-question="sidebars.left.question"
			:active-variant="sidebars.left.variant"
			side="left"
		></AppSidebar>

		<div class="container mx-auto min-w-0 flex-1 px-4">
			<div class="flex gap-5 justify-center relative">
				<SingleMapView
					class="min-w-0 flex-1"
					:split-mode="splitMode"
					@toggle-compare-mode="splitMode = true"
					@toggle-sidebar="(question, variant) => updateSidebar('left', question, variant)"
				/>
				<template v-if="splitMode">
					<div class="divide-accent border-l h-150 self-end"></div>
					<SingleMapView
						class="min-w-0 flex-1"
						:split-mode="splitMode"
						@toggle-sidebar="(question, variant) => updateSidebar('right', question, variant)"
					/>
					<UButton
						class="absolute right-0 top-0 size-6 p-1 m-1 text-muted-foreground"
						variant="ghost"
						@click="closeSplitMode"
					>
						<X></X>
						<span class="sr-only">{{ t("MapsPage.controls.close-split-view") }}</span>
					</UButton>
				</template>
			</div>
		</div>

		<AppSidebar
			v-if="splitMode"
			v-model:open="sidebars.right.open"
			:active-question="sidebars.right.question"
			:active-variant="sidebars.right.variant"
			side="right"
		></AppSidebar>
		<AppSidebar
			v-else
			v-model:open="sidebars.left.open"
			:active-question="sidebars.left.question"
			:active-variant="sidebars.left.variant"
			side="right"
		></AppSidebar>
	</div>
</template>
