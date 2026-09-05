<script setup lang="ts">
import { CircleChevronUp, KeyRound } from "@lucide/vue";
import type { FormSubmitEvent } from "@nuxt/ui";
import * as z from "zod";

import type { AdminUser, UserRole } from "@/pages/admin/user-management.vue";

const props = defineProps<{
	item: AdminUser;
	refresh: () => Promise<void>;
}>();

const env = useRuntimeConfig();
const t = useTranslations();
const toast = useToast();

const isPasswordModalOpen = ref(false);
const isUserRoleModalOpen = ref(false);
const isPasswordSubmitting = ref(false);
const isUserRoleSubmitting = ref(false);

const userRoleNames = ["admin", "editor", "superadmin"] as const;
const userRoles: Array<UserRole> = [
	{ id: 1, description: "Administrator", role_name: "admin" },
	{ id: 2, description: "Editor", role_name: "editor" },
	{ id: 3, description: "Superadmin", role_name: "superadmin" },
];

const setPasswordSchema = z.object({
	password: z.string().min(8, t("Auth.password_min_length")),
});

const setUserRoleSchema = z.object({
	user_role: z.enum(userRoleNames, {
		error: t("Auth.user_role_required"),
	}),
});

type SetPasswordSchema = z.output<typeof setPasswordSchema>;
type SetUserRoleSchema = z.output<typeof setUserRoleSchema>;

const passwordState = reactive<Partial<SetPasswordSchema>>({
	password: "",
});

const getCurrentUserRole = () => {
	return userRoleNames.find((role) => role === props.item.role_name);
};

const userRoleState = reactive<Partial<SetUserRoleSchema>>({
	user_role: getCurrentUserRole(),
});

watch(isPasswordModalOpen, (open) => {
	if (!open) passwordState.password = "";
});

watch(isUserRoleModalOpen, (open) => {
	if (open) userRoleState.user_role = getCurrentUserRole();
});

const onSubmitNewPassword = async (event: FormSubmitEvent<SetPasswordSchema>) => {
	isPasswordSubmitting.value = true;

	try {
		const apiUrl = `/user/password/${props.item.id}`;
		const response = await $fetch<string>(apiUrl, {
			baseURL: env.public.apiBaseUrl,
			method: "PUT",
			body: event.data,
			credentials: "include",
		});

		if (response.length) {
			isPasswordModalOpen.value = false;
			toast.add({
				title: t("UserManagement.actions.password-updated"),
				color: "success",
			});
		}
	} catch (error) {
		console.error(error);
		toast.add({ title: t("UserManagement.actions.password-update-failed"), color: "error" });
	} finally {
		isPasswordSubmitting.value = false;
	}
};

const onSubmitNewUserRole = async (event: FormSubmitEvent<SetUserRoleSchema>) => {
	isUserRoleSubmitting.value = true;

	try {
		const apiUrl = `/user/roles/${props.item.id}`;
		const response = await $fetch<string>(apiUrl, {
			baseURL: env.public.apiBaseUrl,
			method: "PUT",
			body: event.data,
			credentials: "include",
		});

		if (response) {
			isUserRoleModalOpen.value = false;
			toast.add({ title: t("UserManagement.actions.role-updated"), color: "success" });
			await props.refresh();
		}
	} catch (error) {
		console.error(error);
		toast.add({ title: t("UserManagement.actions.role-update-failed"), color: "error" });
	} finally {
		isUserRoleSubmitting.value = false;
	}
};
</script>

<template>
	<div class="flex items-center gap-1">
		<UModal
			v-model:open="isPasswordModalOpen"
			:close="{ disabled: isPasswordSubmitting }"
			:description="t('UserManagement.actions.password-description')"
			:dismissible="!isPasswordSubmitting"
			:title="t('UserManagement.actions.password-title', { username: props.item.username })"
		>
			<UButton
				:aria-label="t('UserManagement.actions.set-password')"
				color="neutral"
				size="sm"
				square
				:title="t('UserManagement.actions.set-password')"
				variant="ghost"
			>
				<KeyRound class="size-4" />
			</UButton>

			<template #body>
				<UForm
					class="space-y-6"
					:schema="setPasswordSchema"
					:state="passwordState"
					@submit="onSubmitNewPassword"
				>
					<UFormField
						:description="t('UserManagement.actions.password-warning')"
						:label="t('Auth.password')"
						name="password"
						required
					>
						<UInput
							v-model="passwordState.password"
							autocomplete="new-password"
							class="w-full"
							:placeholder="t('Auth.password')"
							type="text"
						/>
					</UFormField>

					<div class="flex justify-end gap-3 border-t border-default pt-6">
						<UButton
							color="neutral"
							:disabled="isPasswordSubmitting"
							type="button"
							variant="outline"
							@click="isPasswordModalOpen = false"
						>
							{{ t("General.cancel") }}
						</UButton>
						<UButton :loading="isPasswordSubmitting" type="submit">
							{{ t("UserManagement.actions.save") }}
						</UButton>
					</div>
				</UForm>
			</template>
		</UModal>

		<UModal
			v-if="props.item.role_name !== 'superadmin'"
			v-model:open="isUserRoleModalOpen"
			:close="{ disabled: isUserRoleSubmitting }"
			:dismissible="!isUserRoleSubmitting"
			:title="t('UserManagement.actions.role-title', { username: props.item.username })"
		>
			<UButton
				:aria-label="t('UserManagement.actions.set-role')"
				color="neutral"
				size="sm"
				square
				:title="t('UserManagement.actions.set-role')"
				variant="ghost"
			>
				<CircleChevronUp class="size-4" />
			</UButton>

			<template #body>
				<UForm
					class="space-y-6"
					:schema="setUserRoleSchema"
					:state="userRoleState"
					@submit="onSubmitNewUserRole"
				>
					<UFormField :label="t('Auth.user_role')" name="user_role" required>
						<USelect
							v-model="userRoleState.user_role"
							class="w-full"
							:items="userRoles"
							label-key="description"
							:placeholder="t('Auth.user_role')"
							value-key="role_name"
						/>
					</UFormField>

					<div class="flex justify-end gap-3 border-t border-default pt-6">
						<UButton
							color="neutral"
							:disabled="isUserRoleSubmitting"
							type="button"
							variant="outline"
							@click="isUserRoleModalOpen = false"
						>
							{{ t("General.cancel") }}
						</UButton>
						<UButton :loading="isUserRoleSubmitting" type="submit">
							{{ t("UserManagement.actions.save") }}
						</UButton>
					</div>
				</UForm>
			</template>
		</UModal>
	</div>
</template>
