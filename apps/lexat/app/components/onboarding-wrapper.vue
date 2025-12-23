<script lang="ts" setup>
import { XIcon } from "lucide-vue-next";
import { useVOnboarding, VOnboardingStep, VOnboardingWrapper } from "v-onboarding";

const t = useTranslations();

const colorMode = useColorMode();

const props = defineProps<{
	steps: Array<{
		attachTo: {
			element: string;
		};
		content: {
			title: string;
			description: string;
		};
	}>;
}>();

// ONBOARDING
const wrapper = ref(null);
const { start: startOnboarding, finish: finishOnboarding } = useVOnboarding(wrapper);

defineExpose({ startOnboarding });

const onboardingOptions = { overlay: { padding: 10, borderRadius: 10 } };

const handleStepChange = (direction: () => void): void => {
	direction(); // Execute the library's next/previous action
	focusNextButton();
};

const nextStepButton: Ref<HTMLButtonElement | null> = ref(null);

const focusNextButton = (): void => {
	nextTick(() => {
		// 1. Wait for Vue's DOM update cycle
		// 2. Add a minimal delay to hopefully run *after* the library's internal focus logic
		setTimeout(() => {
			if (nextStepButton.value) {
				nextStepButton.value.focus();
			}
		}, 1);
	});
};

const onboardingFinished = () => {
	const timestamp = new Date().toISOString();
	localStorage.setItem("db-onboarding", JSON.stringify({ finishedAt: timestamp }));
};
</script>

<template>
	<VOnboardingWrapper
		ref="wrapper"
		:options="onboardingOptions"
		:steps="props.steps"
		@finish="onboardingFinished"
	>
		<template #default="{ previous, next, step, isFirst, isLast }">
			<VOnboardingStep data-testid="onboardingStep">
				<div class="bg-white relative shadow sm:rounded-lg mt-5">
					<div class="px-4 py-5 sm:p-6">
						<div class="flex items-center justify-between flex-col gap-5">
							<div v-if="step.content">
								<h3 v-if="step.content.title" class="text-lg font-medium leading-6 text-gray-900">
									{{ t(step.content.title) }}
								</h3>
								<div v-if="step.content.description" class="mt-2 max-w-xl text-sm text-gray-500">
									<p>{{ t(step.content.description) }}</p>
								</div>
							</div>
							<div
								class="mt-5 space-x-4 sm:mt-0 sm:ml-6 sm:flex sm:shrink-0 sm:items-center relative"
							>
								<template v-if="!isFirst">
									<button
										class="inline-flex items-center justify-center rounded-md border border-transparent bg-yellow-100 px-4 py-2 font-medium text-yellow-700 hover:bg-yellow-200 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 sm:text-sm"
										type="button"
										@click="handleStepChange(previous)"
									>
										{{ t("Onboarding.previous") }}
									</button>
								</template>
								<button
									ref="nextStepButton"
									class="inline-flex items-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:text-sm"
									type="button"
									@click="handleStepChange(next)"
								>
									{{ isLast ? t("Onboarding.finish") : t("Onboarding.next") }}
								</button>
							</div>
						</div>
					</div>
					<button
						class="absolute top-3 right-3 cursor-pointer"
						:class="{ 'text-background': colorMode.value === 'dark' }"
						variant="button"
						@click="finishOnboarding"
					>
						<XIcon class="size-5" />
					</button>
				</div>
			</VOnboardingStep>
		</template>
	</VOnboardingWrapper>
</template>
