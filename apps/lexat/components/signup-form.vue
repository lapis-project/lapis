<script setup lang="ts">
import { toTypedSchema } from "@vee-validate/zod";
import { useForm } from "vee-validate";
import { toast } from "vue-sonner";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";

const localePath = useLocalePath();

const env = useRuntimeConfig();

const t = useTranslations();

const user = useUser();

const signUpSchema = toTypedSchema(
	z
		.object({
			email: z.string().endsWith("@oeaw.ac.at").email(t("Auth.email_invalid")),
			password: z.string().min(8, t("Auth.password_min_length")),
			confirmPassword: z.string().min(8, t("Auth.password_min_length")),
			firstname: z.string().min(1, t("Auth.firstname_min_length")),
			lastname: z.string().min(1, t("Auth.lastname_min_length")),
			username: z.optional(z.string()),
			user_role: z.optional(z.string()),
		})
		.refine((data) => data.password === data.confirmPassword, {
			message: t("Auth.password_mismatch"),
			path: ["confirmPassword"],
		}),
);

const { handleSubmit } = useForm({
	validationSchema: signUpSchema,
});

const onSubmit = handleSubmit(async (formValues) => {
	try {
		const apiUrl = "/auth/signup";
		const { confirmPassword, ...body } = formValues; // eslint-disable-line @typescript-eslint/no-unused-vars

		// append a username based on provided firstname and lastname
		const firstInitial = formValues.firstname.trim().charAt(0).toLowerCase();
		const lastName = formValues.lastname.trim().replace(/\s+/g, "").toLowerCase();
		body.username = firstInitial + lastName;

		body.user_role = "editor";

		const response = await $fetch(apiUrl, {
			baseURL: env.public.apiBaseUrl,
			method: "POST",
			body,
			credentials: "include",
		});
		if (response) {
			user.value = response;
			await navigateTo(localePath("/admin/articles"));
		}
	} catch (error) {
		console.error(error);
		toast.error(t("Auth.signup_failed"));
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
						id="signup-email"
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
						id="signup-password"
						:placeholder="t('Auth.password')"
						type="password"
						v-bind="componentField"
					/>
				</FormControl>
				<FormMessage />
			</FormItem>
		</FormField>
		<FormField v-slot="{ componentField }" name="confirmPassword">
			<FormItem>
				<FormLabel>{{ t("Auth.confirmPassword") }}</FormLabel>
				<FormControl>
					<Input
						id="confirmPassword"
						:placeholder="t('Auth.confirmPasswordPlaceholder')"
						type="password"
						v-bind="componentField"
					/>
				</FormControl>
				<FormMessage />
			</FormItem>
		</FormField>
		<FormField v-slot="{ componentField }" name="firstname">
			<FormItem>
				<FormLabel>{{ t("Auth.firstname") }}</FormLabel>
				<FormControl>
					<Input
						id="firstname"
						:placeholder="t('Auth.firstname')"
						type="text"
						v-bind="componentField"
					/>
				</FormControl>
				<FormMessage />
			</FormItem>
		</FormField>
		<FormField v-slot="{ componentField }" name="lastname">
			<FormItem>
				<FormLabel>{{ t("Auth.lastname") }}</FormLabel>
				<FormControl>
					<Input
						id="lastname"
						:placeholder="t('Auth.lastname')"
						type="text"
						v-bind="componentField"
					/>
				</FormControl>
				<FormMessage />
			</FormItem>
		</FormField>
		<Button type="submit"> {{ t("Auth.signup") }} </Button>
	</form>
</template>
