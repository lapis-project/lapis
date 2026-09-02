<script setup lang="ts">
import type { FormSubmitEvent } from "@nuxt/ui";
import type { InferResponseType } from "hono/client";
import * as z from "zod";

const toast = useToast();

const localePath = useLocalePath();

const env = useRuntimeConfig();

const t = useTranslations();

const user = useUser();

const route = useRoute();

const { apiClient } = useApiClient();

const _doLogin = apiClient.auth.login.$post;
type APILogin = InferResponseType<typeof _doLogin, 200>;

const signInSchema = z.object({
	email: z
		.email("Please specify an e-mail address")
		.regex(/@(oeaw\.ac\.at|univie\.ac\.at)$/i, t("Auth.email_domain_invalid")),
	password: z.string("Password is required"),
});

type SignInSchema = z.output<typeof signInSchema>;

const state = reactive<Partial<SignInSchema>>({
	email: undefined,
	password: undefined,
});

async function onSubmit(event: FormSubmitEvent<SignInSchema>) {
	try {
		const apiUrl = "/auth/login";

		const response = await $fetch<APILogin>(apiUrl, {
			baseURL: env.public.apiBaseUrl,
			method: "POST",
			body: { ...state },
			credentials: "include",
		});
		const redirectPath = route.query.redirect;
		if (response) {
			user.value = response;
			await navigateTo(localePath(redirectPath?.toString() ?? "/"));
		}
	} catch (error) {
		console.error(error);
		toast.add({ title: t("Auth.login_failed"), color: "error" });
	}
}
</script>

<template>
	<UForm :schema="signInSchema" :state="state" class="space-y-4" @submit="onSubmit">
		<UFormField label="Email" name="email">
			<UInput v-model="state.email" />
		</UFormField>

		<UFormField label="Password" name="password">
			<UInput v-model="state.password" type="password" />
		</UFormField>

		<UButton type="submit"> Submit </UButton>
	</UForm>
</template>
