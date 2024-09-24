<script lang="ts" setup>
const t = useTranslations();

usePageMetadata({
	title: t("ProfilePage.meta.title"),
});
</script>

<template>
	<MainContent class="container grid content-start gap-y-8 py-8">
		<div class="mx-auto w-full max-w-2xl border p-8">
			<LoginForm></LoginForm>
		</div>
		<DevOnly>
			<div class="mx-auto w-full max-w-2xl border p-8">
				<h2>Secret signup form</h2>
				<LoginForm is-sign-up></LoginForm>
			</div>
		</DevOnly>
	</MainContent>
</template>
