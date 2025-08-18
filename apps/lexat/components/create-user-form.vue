<script setup lang="ts">
import { toTypedSchema } from "@vee-validate/zod";
import type { InferResponseType } from "hono/client";
import { useForm } from "vee-validate";
import { toast } from "vue-sonner";
import * as z from "zod";

import type { UserRole } from "@/pages/admin/user-management.vue";

const { apiClient } = useApiClient();
const _createUser = apiClient.auth["create-user"].$post;
type APICreateUser = InferResponseType<typeof _createUser, 200>;

const env = useRuntimeConfig();

const t = useTranslations();

const props = defineProps<{
	userRoles?: Array<UserRole>;
}>();

const emit = defineEmits<{
	(event: "cancel" | "new-user-created"): void;
}>();

const signUpSchema = toTypedSchema(
	z.object({
		email: z
			.string()
			.trim()
			.email(t("Auth.email_invalid"))
			.regex(/@(oeaw\.ac\.at|univie\.ac\.at)$/i, t("Auth.email_domain_invalid")),
		password: z.string().min(8, t("Auth.password_min_length")),
		// confirmPassword: z.string().min(8, t("Auth.password_min_length")),
		firstname: z.string().min(1, t("Auth.firstname_min_length")),
		lastname: z.string().min(1, t("Auth.lastname_min_length")),
		username: z.optional(z.string()),
		user_role: z.optional(z.string()),
	}),
	// .refine((data) => data.password === data.confirmPassword, {
	// 	message: t("Auth.password_mismatch"),
	// 	path: ["confirmPassword"],
	// }),
);

const { handleSubmit } = useForm({
	validationSchema: signUpSchema,
});

const onSubmit = handleSubmit(async (formValues) => {
	try {
		const apiUrl = "/auth/create-user";
		const { ...body } = formValues;

		// append a username based on provided firstname and lastname
		const firstInitial = formValues.firstname.trim().charAt(0).toLowerCase();
		const lastName = formValues.lastname.trim().replace(/\s+/g, "").toLowerCase();
		body.username = firstInitial + lastName;

		const response = await $fetch<APICreateUser>(apiUrl, {
			baseURL: env.public.apiBaseUrl,
			method: "POST",
			body,
			credentials: "include",
		});
		if (response.user) {
			emit("new-user-created");
			toast.success(t("Auth.user_creation_succeeded"));
		}
	} catch (error) {
		console.error(error);
		toast.error(t("Auth.user_creation_failed"));
	}
});
</script>

<template>
	<form class="space-y-5" @submit="onSubmit">
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
						:placeholder="t('Auth.password')"
						type="text"
						v-bind="componentField"
					/>
				</FormControl>
				<FormDescription>
					Bitte notiere dir das Passwort! Dieses ist nach der Erstellung nicht mehr abrufbar.
				</FormDescription>
				<FormMessage />
			</FormItem>
		</FormField>
		<!-- <FormField v-slot="{ componentField }" name="confirmPassword">
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
		</FormField> -->
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
		<FormField v-slot="{ componentField }" name="user_role">
			<FormItem>
				<FormLabel>{{ t("Auth.user_role") }}</FormLabel>
				<Select id="user_role" v-bind="componentField">
					<FormControl>
						<SelectTrigger>
							<SelectValue :placeholder="t('Auth.user_role')" />
						</SelectTrigger>
					</FormControl>
					<SelectContent>
						<SelectGroup>
							<SelectItem v-for="role in props.userRoles" :key="role.id" :value="role.role_name">{{
								role.description
							}}</SelectItem>
						</SelectGroup>
					</SelectContent>
				</Select>
				<FormMessage />
			</FormItem>
		</FormField>
		<div class="mt-6 flex gap-4 border-t pt-6 justify-between">
			<slot></slot>
			<Button type="submit"> {{ t("General.create") }} </Button>
		</div>
	</form>
</template>
