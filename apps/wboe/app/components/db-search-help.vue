<script setup lang="ts">
const { t } = useI18n();
</script>

<template>
	<UModal :title="t('DbPage.helpTitle')" :description="t('DbPage.helpDescription')">
		<UButton
			color="neutral"
			icon="i-lucide-circle-help"
			:label="t('DbPage.help')"
			variant="outline"
		/>

		<template #body>
			<dl class="space-y-4 text-sm text-default">
				<div>
					<dt class="font-semibold">{{ t("DbPage.prefix") }}</dt>
					<dd>{{ t("DbPage.helpPrefix") }}</dd>
				</div>
				<div>
					<dt class="font-semibold">{{ t("DbPage.wildcard") }}</dt>
					<dd>{{ t("DbPage.helpWildcard") }}</dd>
				</div>
				<div>
					<dt class="font-semibold">{{ t("DbPage.fuzzy") }}</dt>
					<dd>{{ t("DbPage.helpFuzzy") }}</dd>
				</div>
				<div>
					<dt class="font-semibold">{{ t("DbPage.helpTableTitle") }}</dt>
					<dd>{{ t("DbPage.helpTable") }}</dd>
				</div>
			</dl>
		</template>
		<template #footer>
			<UButton
				color="neutral"
				:label="t('DbPage.helpMore')"
				to="https://lioe-cms.dioe.at/materialien/belegdatenbank-1/suchmoeglichkeiten-in-der-wboe-db"
				target="_blank"
				trailing-icon="i-lucide-external-link"
				variant="outline"
			/>
		</template>
	</UModal>
</template>
