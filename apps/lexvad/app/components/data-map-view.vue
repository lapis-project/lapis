<script lang="ts" setup>
import { X } from "@lucide/vue";

const positions = ["left", "right"] as const;

type MapPosition = (typeof positions)[number];

interface SidebarState {
	open: boolean;
	question: string;
	variant: string;
}

const t = useTranslations();
const datasetStore = useDatasetStore();
const route = useRoute();

const questions: Record<MapPosition, ReturnType<typeof useQuestions>> = {
	left: useQuestions(() => datasetStore.datasetForMap("left")),
	right: useQuestions(() => datasetStore.datasetForMap("right")),
};

const splitMode = ref(false);

function defaultVariant(position: MapPosition, question: string) {
	return questions[position].getValuesForQuestion(question)[0] ?? "";
}

function createSidebarState(position: MapPosition): SidebarState {
	const question = questions[position].allQuestions.value[0] ?? "";
	return {
		open: false,
		question,
		variant: defaultVariant(position, question),
	};
}

watchEffect(() => {
	const id = route.query.dataset;
	if (typeof id === "string") datasetStore.setDatasetForMap("left", id);
});

const sidebars = ref<Record<MapPosition, SidebarState>>({
	left: createSidebarState("left"),
	right: createSidebarState("right"),
});

function updateSidebar(position: MapPosition, question: string | null, variant?: string) {
	const sidebar = sidebars.value[position];
	const selectedQuestion = question ?? sidebar.question;
	const selectedVariant = variant ?? defaultVariant(position, selectedQuestion);
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
	sidebars.value.right.open = false;
}

positions.forEach((position) => {
	watch(
		() => datasetStore.datasetForMap(position),
		() => {
			sidebars.value[position] = createSidebarState(position);
		},
	);

	watch(
		() => sidebars.value[position].question,
		(question) => {
			sidebars.value[position].variant = defaultVariant(position, question);
		},
	);
});
</script>

<template>
	<div class="flex min-h-0">
		<AppSidebar
			v-if="splitMode"
			v-model:open="sidebars.left.open"
			:active-question="sidebars.left.question"
			:active-variant="sidebars.left.variant"
			side="left"
			map-id="left"
		></AppSidebar>

		<div class="container mx-auto min-w-0 flex-1 px-4">
			<div class="flex gap-5 justify-center relative">
				<SingleMapView
					class="min-w-0 flex-1"
					:split-mode="splitMode"
					@toggle-compare-mode="splitMode = true"
					@toggle-sidebar="(question, variant) => updateSidebar('left', question, variant)"
					v-model:question="sidebars.left.question"
					map-id="left"
				/>
				<template v-if="splitMode">
					<div class="divide-accent border-l h-150 self-end"></div>
					<SingleMapView
						class="min-w-0 flex-1"
						:split-mode="splitMode"
						@toggle-sidebar="(question, variant) => updateSidebar('right', question, variant)"
						v-model:question="sidebars.right.question"
						map-id="right"
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
			map-id="right"
			side="right"
		></AppSidebar>
		<AppSidebar
			v-else
			v-model:open="sidebars.left.open"
			:active-question="sidebars.left.question"
			:active-variant="sidebars.left.variant"
			map-id="left"
			side="right"
		></AppSidebar>
	</div>
</template>
