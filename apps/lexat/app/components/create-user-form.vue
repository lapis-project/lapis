<script setup lang="ts">
import type { FormSubmitEvent } from "@nuxt/ui";
import type { InferResponseType } from "hono/client";
import { toast } from "vue-sonner";
import * as z from "zod";

import type { UserRole } from "@/pages/admin/user-management.vue";

const { apiClient } = useApiClient();
const _createUser = apiClient.auth["create-user"].$post;
type APICreateUser = InferResponseType<typeof _createUser, 200>;

const env = useRuntimeConfig();
const t = useTranslations();

const props = defineProps<{
	userRoles: Array<UserRole>;
}>();

const emit = defineEmits<{
	(event: "cancel" | "new-user-created"): void;
}>();

const signUpSchema = z.object({
	email: z
		.string()
		.trim()
		.email(t("Auth.email_invalid"))
		.regex(/@(oeaw\.ac\.at|univie\.ac\.at)$/i, t("Auth.email_domain_invalid")),
	password: z.string().min(8, t("Auth.password_min_length")),
	firstname: z.string().trim().min(1, t("Auth.firstname_min_length")),
	lastname: z.string().trim().min(1, t("Auth.lastname_min_length")),
	user_role: z.enum(["admin", "editor", "superadmin"], {
		error: t("Auth.user_role_required"),
	}),
});

type SignUpSchema = z.output<typeof signUpSchema>;

const state = reactive<Partial<SignUpSchema>>({
	email: "",
	password: "",
	firstname: "",
	lastname: "",
	user_role: undefined,
});

const onSubmit = async (event: FormSubmitEvent<SignUpSchema>) => {
	try {
		const formValues = event.data;
		const firstInitial = formValues.firstname.charAt(0).toLowerCase();
		const lastName = formValues.lastname.replace(/\s+/g, "").toLowerCase();
		const body = {
			...formValues,
			username: firstInitial + lastName,
		};

		const response = await $fetch<APICreateUser>("/auth/create-user", {
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
};
</script>

<template>
	<UForm
		v-slot="{ loading }"
		class="space-y-5"
		:schema="signUpSchema"
		:state="state"
		@submit="onSubmit"
	>
		<UFormField :label="t('Auth.email')" name="email" required>
			<UInput
				v-model="state.email"
				autocomplete="username"
				class="w-full"
				:placeholder="t('Auth.email')"
				type="email"
			/>
		</UFormField>

		<UFormField
			description="Bitte notiere dir das Passwort! Dieses ist nach der Erstellung nicht mehr abrufbar."
			:label="t('Auth.password')"
			name="password"
			required
		>
			<UInput
				v-model="state.password"
				autocomplete="new-password"
				class="w-full"
				:placeholder="t('Auth.password')"
				type="text"
			/>
		</UFormField>

		<UFormField :label="t('Auth.firstname')" name="firstname" required>
			<UInput
				v-model="state.firstname"
				autocomplete="given-name"
				class="w-full"
				:placeholder="t('Auth.firstname')"
				type="text"
			/>
		</UFormField>

		<UFormField :label="t('Auth.lastname')" name="lastname" required>
			<UInput
				v-model="state.lastname"
				autocomplete="family-name"
				class="w-full"
				:placeholder="t('Auth.lastname')"
				type="text"
			/>
		</UFormField>

		<UFormField :label="t('Auth.user_role')" name="user_role" required>
			<USelect
				v-model="state.user_role"
				class="w-full"
				:items="props.userRoles"
				label-key="description"
				:placeholder="t('Auth.user_role')"
				value-key="role_name"
			/>
		</UFormField>

		<div class="flex justify-between gap-4 border-t border-default pt-6">
			<UButton color="neutral" type="button" variant="outline" @click="emit('cancel')">
				{{ t("General.cancel") }}
			</UButton>
			<UButton :loading="loading" type="submit">
				{{ t("General.create") }}
			</UButton>
		</div>
	</UForm>
</template>
