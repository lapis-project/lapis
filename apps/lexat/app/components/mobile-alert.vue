<script lang="ts" setup>
const t = useTranslations();
</script>

<template>
	<UAlert
		color="neutral"
		:title="t('MobileAlert.title')"
		:description="t('MobileAlert.text')"
		icon="i-lucide-alert-circle"
		class="max-w-sm sm:hidden"
	/>
</template>
