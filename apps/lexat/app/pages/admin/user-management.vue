<script lang="ts" setup>
import type { InferResponseType } from "hono/client";

import CreateUserForm from "@/components/create-user-form.vue";
import UserTable from "@/components/users/user-table.vue";

import { columns } from "../../components/users/columns";

export type UserRole = APIAdminUsers["userRoles"][number];

const t = useTranslations();
const env = useRuntimeConfig();
const isDialogOpen = ref(false);

const headers = useRequestHeaders(["cookie"]);

definePageMeta({
	layout: "cms",
	middleware: ["protected", "superadmin"],
});

usePageMetadata({
	title: t("UserManagement.title"),
});

const { apiClient } = useApiClient();
const _getAdminUsers = apiClient.cms.users.all.$get;
export type APIAdminUsers = InferResponseType<typeof _getAdminUsers, 200>;
export type AdminUser = APIAdminUsers["users"][number];

const { data, refresh } = useFetch<APIAdminUsers>("/cms/users/all", {
	baseURL: env.public.apiBaseUrl,
	method: "GET",
	credentials: "include",
	headers: headers,
});

const users = computed(() => {
	return data.value?.users || [];
});

const userRoles = computed(() => {
	return data.value?.userRoles ?? [];
});

const closeCreateUserDialog = () => {
	isDialogOpen.value = false;
};

const onNewUserCreated = async () => {
	await refresh();
	closeCreateUserDialog();
};
</script>

<template>
	<main class="w-full grid content-start gap-8" :tabindex="-1">
		<div class="flex items-center justify-between">
			<PageTitle>{{ t("UserManagement.title") }}</PageTitle>
			<UModal v-model:open="isDialogOpen" :title="t('UserManagement.create-new-user')">
				<UButton icon="i-lucide-plus">
					{{ t("UserManagement.create-new-user") }}
				</UButton>

				<template #body>
					<CreateUserForm
						:user-roles="userRoles"
						@cancel="closeCreateUserDialog"
						@new-user-created="onNewUserCreated"
					/>
				</template>
			</UModal>
		</div>
		<section>
			<UserTable v-if="users?.length" :columns="columns" :data="users" :refresh="refresh" />
		</section>
	</main>
</template>
