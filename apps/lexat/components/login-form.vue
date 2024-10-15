<script setup lang="ts">
import { toTypedSchema } from "@vee-validate/zod";
import { useForm } from "vee-validate";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast/use-toast";

const localePath = useLocalePath();

const env = useRuntimeConfig();

const { toast } = useToast();

const t = useTranslations();

const user = useUser();

const signInSchema = toTypedSchema(
	z.object({
		email: z.string({ required_error: "Please specify an e-mail address" }),
		password: z.string({ required_error: "Please specify a password" }),
	}),
);

const { handleSubmit } = useForm({
	validationSchema: signInSchema,
});

const onSubmit = handleSubmit(async (formValues) => {
	try {
		const apiUrl = "/auth/login";

		const response = await $fetch(apiUrl, {
			baseURL: env.public.apiBaseUrl,
			method: "POST",
			body: { ...formValues },
			credentials: "include",
		});
		if (response) {
			user.value = response;
			await navigateTo(localePath("/admin/articles"));
		}
	} catch (error) {
		toast({
			title: t("Auth.login_failed"),
			description: error || t("Auth.login_failed"),
			variant: "destructive",
		});
	}
});
</script>

<template>
	<form class="w-2/3 space-y-6" @submit="onSubmit">
		<FormField v-slot="{ componentField }" name="email">
			<FormItem>
				<FormLabel>{{ t("Auth.email") }}</FormLabel>
				<FormControl>
					<Label class="sr-only" for="email">{{ t("Auth.email") }}</Label>
					<Input
						id="email"
						autocomplete="username"
						:placeholder="t('Auth.email')"
						required
						type="email"
						v-bind="componentField"
					/>
				</FormControl>
				<FormMessage />
			</FormItem>
		</FormField>

		<FormField v-slot="{ componentField }" name="password">
			<FormItem>
				<FormLabel>{{ t("Auth.password") }}</FormLabel>
				<FormControl>
					<Label class="sr-only" for="password">{{ t("Auth.password") }}</Label>
					<Input
						id="password"
						autocomplete="current-password"
						:placeholder="t('Auth.password')"
						type="password"
						v-bind="componentField"
					/>
				</FormControl>
				<FormMessage />
			</FormItem>
		</FormField>

		<Button type="submit"> {{ t("Auth.login") }} </Button>
		<Toaster />
	</form>
</template>
