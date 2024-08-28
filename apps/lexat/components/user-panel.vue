<script setup lang="ts">
import { LogOut, PanelLeft, User, UserRound } from "lucide-vue-next";

import { useToast } from "@/components/ui/toast/use-toast";
import type { AuthUser } from "@/types/api";

const t = useTranslations();

const user = useUser();

const { toast } = useToast();

const login = async () => {
	const data: AuthUser | null = await useRequestFetch()("/api/user");
	if (data) {
		user.value = data;
		toast({
			title: `Successfully logged in as ${user.value.username ?? ""}`,
		});
	}
};

const logout = () => {
	// await $fetch("/api/logout", {
	// 	method: "POST",
	// });
	// await navigateTo("/login");
	user.value = null;
	toast({
		title: "Successfully logged out.",
	});
};

const firstLetterUppercase = (value: string) => {
	return value.charAt(0).toUpperCase();
};
</script>

<template>
	<DropdownMenu>
		<DropdownMenuTrigger as-child>
			<Button size="icon" class="size-8 rounded-full">
				<div v-if="user?.username">{{ firstLetterUppercase(user.username) }}</div>
				<UserRound v-else class="size-5" />
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
