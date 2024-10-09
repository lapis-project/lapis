<script setup lang="ts">
import { toTypedSchema } from "@vee-validate/zod";
import { useForm } from "vee-validate";
import { computed } from "vue";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast/use-toast";

export interface Props {
	isSignUp?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
	isSignUp: false,
});

const localePath = useLocalePath();

const env = useRuntimeConfig();

const { toast } = useToast();

const t = useTranslations();

const signInSchema = toTypedSchema(
	z.object({
		username: z.string(),
		password: z.string(),
	}),
);

const signUpSchema = toTypedSchema(
	z
		.object({
			username: z.string().min(2, t("Auth.username_min_length")),
			password: z.string().min(8, t("Auth.password_min_length")),
			confirmPassword: z.string().min(8, t("Auth.password_min_length")),
			// email: z.string().email(t("Auth.email_invalid")), // currently not implemented
		})
		.refine((data) => data.password === data.confirmPassword, {
			message: t("Auth.password_mismatch"),
			path: ["confirmPassword"],
		}),
);

const formSchema = computed(() => {
	return props.isSignUp ? signUpSchema : signInSchema;
});

const { handleSubmit } = useForm({
	validationSchema: formSchema,
});

const onSubmit = handleSubmit(async (formValues) => {
	try {
		const apiUrl = props.isSignUp ? "/auth/signup" : "/auth/login"; // Toggle API endpoint

		const response = await $fetch(apiUrl, {
			baseURL: env.public.apiBaseUrl,
			method: "POST",
			body: {
				...formValues,
			},
			credentials: "include",
		});
		if (response) {
			await navigateTo(localePath("/admin/articles"));
		}
	} catch (error) {
		toast({
			title: props.isSignUp ? t("Auth.signup_failed") : t("Auth.login_failed"),
			description: error || (props.isSignUp ? t("Auth.signup_failed") : t("Auth.login_failed")),
			variant: "destructive",
		});
	}
});
</script>

<template>
	<form class="w-2/3 space-y-6" @submit="onSubmit">
		<FormField v-slot="{ componentField }" name="username">
			<FormItem>
				<FormLabel>{{ t("Auth.username") }}</FormLabel>
				<FormControl>
					<Label class="sr-only" for="username">{{ t("Auth.username") }}</Label>
					<Input
						id="username"
						:placeholder="t('Auth.username')"
						type="text"
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
						:placeholder="t('Auth.password')"
						type="password"
						v-bind="componentField"
					/>
				</FormControl>
				<FormMessage />
			</FormItem>
		</FormField>

		<!-- Only show confirmPassword and email for sign-up -->
		<div v-if="props.isSignUp">
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
			<!--
				<FormField v-slot="{ componentField }" name="email">
					<FormItem>
						<FormLabel>{{ t("Auth.email") }}</FormLabel>
						<FormControl>
							<Input
								id="email"
								type="email"
								:placeholder="t('Auth.email')"
								v-bind="componentField"
							/>
						</FormControl>
						<FormMessage />
					</FormItem>
				</FormField> -->
		</div>
		<Button type="submit"> {{ props.isSignUp ? t("Auth.signup") : t("Auth.login") }} </Button>
		<Toaster />
	</form>
</template>
