<script lang="ts" setup>
import type { InferResponseType } from "hono/client";
import { Plus } from "lucide-vue-next";

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
	return data.value?.userRoles;
});

const onNewUserCreated = () => {
	refresh();
	isDialogOpen.value = false;
};
</script>

<template>
	<main class="w-full grid gap-8" :tabindex="-1">
		<div class="flex justify-between">
			<PageTitle>{{ t("UserManagement.title") }}</PageTitle>
			<Dialog :open="isDialogOpen" @update:open="(newVal) => (isDialogOpen = newVal)">
				<DialogTrigger as-child>
					<Button><Plus class="mr-2 size-4" />{{ t("UserManagement.create-new-user") }}</Button>
				</DialogTrigger>
				<DialogContent class="p-8">
					<CreateUserForm :user-roles="userRoles" @new-user-created="onNewUserCreated"
						><DialogClose as-child>
							<Button type="button" variant="secondary">
								{{ t("General.cancel") }}
							</Button>
						</DialogClose></CreateUserForm
					>
				</DialogContent>
			</Dialog>
		</div>
		<section>
			<UserTable
				v-if="users?.length"
				:columns="columns"
				:data="users"
				:refresh="refresh"
				:user-roles="userRoles"
			/>
		</section>
	</main>
</template>
