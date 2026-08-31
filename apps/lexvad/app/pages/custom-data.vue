<script lang="ts" setup>
import { FlaskConicalIcon } from "@lucide/vue";

const t = useTranslations();

usePageMetadata({ title: t("ExperimentalPage.meta.title") });
</script>

<template>
	<div class="container mx-auto max-w-4xl px-4 py-16 flex flex-col gap-8">
		<div class="flex flex-col gap-3">
			<div class="flex flex-wrap items-center gap-3">
				<PageTitle>{{ t("ExperimentalPage.title") }}</PageTitle>
				<UBadge class="gap-1" color="warning" variant="subtle">
					<FlaskConicalIcon class="size-3"></FlaskConicalIcon>
					{{ t("ExperimentalPage.badge") }}
				</UBadge>
			</div>
			<p class="text-muted-foreground">{{ t("ExperimentalPage.lead") }}</p>
		</div>

		<UAlert
			color="info"
			:description="t('ExperimentalPage.notice.text')"
			icon="i-lucide-info"
			:title="t('ExperimentalPage.notice.title')"
			variant="subtle"
		/>

		<DatasetUploadCard></DatasetUploadCard>
		<DatasetListCard></DatasetListCard>
	</div>
</template>
