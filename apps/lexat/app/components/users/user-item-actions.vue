<script setup lang="ts">
import { toTypedSchema } from "@vee-validate/zod";
import type { InferResponseType } from "hono/client";
import { CircleChevronUp, KeyRound } from "lucide-vue-next";
import { toast } from "vue-sonner";
import * as z from "zod";

import { useApiClient } from "@/composables/use-api-client";
import type { UserRole } from "@/pages/admin/user-management.vue";

const env = useRuntimeConfig();
const { apiClient } = useApiClient();
const t = useTranslations();

const isPasswordDialogOpen = ref(false);
const isUserRoleDialogOpen = ref(false);
const userRoles: Array<UserRole> = [
	{ id: 1, description: "Administrator", role_name: "admin" },
	{ id: 2, description: "Editor", role_name: "editor" },
	{ id: 3, description: "Superadmin", role_name: "superadmin" },
];

const props = defineProps<{
	item: {
		id: number;
		username: string;
		role_name: string;
	};
	refresh: () => Promise<void>;
}>();

const setPasswordSchema = toTypedSchema(
	z.object({
		password: z.string().min(8, t("Auth.password_min_length")),
	}),
);

const setUserRoleSchema = toTypedSchema(
	z.object({
		user_role: z.enum(["admin", "editor", "superadmin"] as const, {
			required_error: t("Auth.user_role_required"),
			invalid_type_error: t("Auth.user_role_invalid"),
		}),
	}),
);

const _putPassword = apiClient.user.password[":id"].$put;
type APIPutPassword = InferResponseType<typeof _putPassword, 200>;

const onSubmitNewPassword = async (body) => {
	try {
		const apiUrl = `/user/password/${props.item.id}`;
		const response = await $fetch<APIPutPassword>(apiUrl, {
			baseURL: env.public.apiBaseUrl,
			method: "PUT",
			body,
			credentials: "include",
		});
		if (response.length) {
			isPasswordDialogOpen.value = false;
			toast.success("New password successfully set.");
		}
	} catch (error) {
		console.error(error);
		toast.error("Could not set new password.");
	}
};

const _putUserRole = apiClient.user.roles[":id"].$put;
type APIPutUserRole = InferResponseType<typeof _putUserRole, 200>;

const onSubmitNewUserRole = async (body) => {
	try {
		const apiUrl = `/user/roles/${props.item.id}`;
		const response = await $fetch<APIPutUserRole>(apiUrl, {
			baseURL: env.public.apiBaseUrl,
			method: "PUT",
			body,
			credentials: "include",
		});
		if (response) {
			isUserRoleDialogOpen.value = false;
			toast.success("New user role successfully set.");
			await props.refresh();
		}
	} catch (error) {
		console.error(error);
		toast.error("Could not set new user role.");
	}
};

// const deleteItem = async () => {
// 	try {
// 		await props.onDelete(props.item.post_id);
// 		toast.success(t("AdminPage.articles.deletion_succeeded"));
// 	} catch {
// 		toast.error(t("AdminPage.articles.deletion_failed"));
// 	}
// };
</script>

<template>
	<div class="flex gap-4">
		<Form v-slot="{ handleSubmit }" as="" keep-values :validation-schema="setPasswordSchema">
			<Dialog
				:open="isPasswordDialogOpen"
				@update:open="(newVal: boolean) => (isPasswordDialogOpen = newVal)"
			>
				<DialogTrigger as-child>
					<KeyRound class="size-5 cursor-pointer hover:text-accent-foreground"></KeyRound>
				</DialogTrigger>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Set new password for {{ props.item.username }}</DialogTitle>
					</DialogHeader>
					<form id="setPasswordForm" @submit="handleSubmit($event, onSubmitNewPassword)">
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
									Bitte notiere dir das neue Passwort! Dieses ist nach der Änderung nicht mehr
									abrufbar.
								</FormDescription>
								<FormMessage />
							</FormItem>
						</FormField>
					</form>
					<DialogFooter>
						<Button form="setPasswordForm" type="submit">Continue</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</Form>

		<Form
			v-if="props.item.role_name !== 'superadmin'"
			v-slot="{ handleSubmit }"
			as=""
			keep-values
			:validation-schema="setUserRoleSchema"
		>
			<Dialog
				:open="isUserRoleDialogOpen"
				@update:open="(newVal: boolean) => (isUserRoleDialogOpen = newVal)"
			>
				<DialogTrigger as-child>
					<CircleChevronUp
						class="size-5 cursor-pointer hover:text-accent-foreground"
					></CircleChevronUp>
				</DialogTrigger>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Set new password for {{ props.item.username }}</DialogTitle>
					</DialogHeader>
					<form id="setUserRoleForm" @submit="handleSubmit($event, onSubmitNewUserRole)">
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
											<SelectItem
												v-for="role in userRoles"
												:key="role.id"
												:value="role.role_name"
												>{{ role.description }}</SelectItem
											>
										</SelectGroup>
									</SelectContent>
								</Select>
								<FormMessage />
							</FormItem>
						</FormField>
					</form>
					<DialogFooter>
						<Button form="setUserRoleForm" type="submit">Continue</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</Form>
	</div>
</template>
