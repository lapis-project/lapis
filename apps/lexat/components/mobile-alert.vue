<script lang="ts" setup>
import { AlertCircle } from "lucide-vue-next";

const t = useTranslations();
</script>

<template>
	<Alert class="mb-5 max-w-md grid sm:hidden">
		<AlertCircle class="h-4 w-4" />
		<AlertTitle>{{ t("MobileAlert.title") }}</AlertTitle>
		<AlertDescription> {{ t("MobileAlert.text") }} </AlertDescription>
	</Alert>
</template>
