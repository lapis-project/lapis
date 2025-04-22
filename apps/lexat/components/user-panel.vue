<script setup lang="ts">
import { LogOut, PanelLeft, User, UserRound } from "lucide-vue-next";
import { toast } from "vue-sonner";

const localePath = useLocalePath();
const env = useRuntimeConfig();

const t = useTranslations();

const user = useUser();

const login = async () => {
	await navigateTo(localePath("/login"));
};

const logout = async () => {
	try {
		await $fetch("/auth/logout", {
			baseURL: env.public.apiBaseUrl,
			credentials: "include",
			method: "POST",
		});
		user.value = null;
		await navigateTo(localePath("/"));
	} catch (e) {
		if (env.NODE_ENV !== "production") {
			console.error(e);
		}
		toast.error("Unable to log out");
	}
};

const firstLetterUppercase = (value: string) => {
	return value.charAt(0).toUpperCase();
};
</script>

<template>
	<DropdownMenu>
		<DropdownMenuTrigger as-child>
			<Button class="size-8 rounded-full" size="icon">
				<ClientOnly>
					<div v-if="user?.username">{{ firstLetterUppercase(user.username) }}</div>
					<UserRound v-else class="size-5" />
				</ClientOnly>
			</Button>
		</DropdownMenuTrigger>
		<DropdownMenuContent class="mr-2 w-56">
			<template v-if="user">
				<DropdownMenuLabel>{{ user?.username }}</DropdownMenuLabel>
				<DropdownMenuSeparator />
				<DropdownMenuGroup>
					<NuxtLinkLocale to="/profile">
						<DropdownMenuItem>
							<User class="mr-2 size-4" />{{ t("UserPanel.profile") }}
						</DropdownMenuItem>
					</NuxtLinkLocale>
					<NuxtLinkLocale to="/admin/articles">
						<DropdownMenuItem>
							<PanelLeft class="mr-2 size-4" />
							{{ t("UserPanel.admin") }}
						</DropdownMenuItem>
					</NuxtLinkLocale>
					<!-- <DropdownMenuItem>
          <Settings class="mr-2 h-4 w-4" />
          <span>Settings</span>
          <DropdownMenuShortcut>⌘S</DropdownMenuShortcut>
        </DropdownMenuItem> -->
				</DropdownMenuGroup>
				<DropdownMenuSeparator />
				<DropdownMenuItem @click="logout()">
					<LogOut class="mr-2 size-4" />
					{{ t("UserPanel.logout") }}
				</DropdownMenuItem>
			</template>
			<template v-else>
				<DropdownMenuItem @click="login()">
					<LogOut class="mr-2 size-4" />
					{{ t("UserPanel.login") }}
				</DropdownMenuItem>
			</template>
		</DropdownMenuContent>
	</DropdownMenu>
</template>
