<script setup lang="ts">
import { LogOut, PanelLeft, User, UserRound } from "lucide-vue-next";

const t = useTranslations();

const logout = () => {
	// await $fetch("/api/logout", {
	// 	method: "POST",
	// });
	// await navigateTo("/login");
	console.log("logout");
};
</script>

<template>
	<DropdownMenu>
		<DropdownMenuTrigger as-child>
			<Button size="icon" class="size-8 rounded-full"> <UserRound class="size-5" /> </Button>
		</DropdownMenuTrigger>
		<DropdownMenuContent class="mr-2 w-56">
			<DropdownMenuLabel>My Account</DropdownMenuLabel>
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
		</DropdownMenuContent>
	</DropdownMenu>
</template>
