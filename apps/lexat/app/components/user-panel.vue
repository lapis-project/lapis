<script setup lang="ts">
import type { DropdownMenuItem } from "@nuxt/ui";

const localePath = useLocalePath();
const env = useRuntimeConfig();
const t = useTranslations();
const user = useUser();
const toast = useToast();

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
		toast.add({
			title: "Unable to log out",
			color: "error",
			icon: "i-lucide-circle-alert",
		});
	}
};

const firstLetterUppercase = (value: string) => {
	return value.charAt(0).toUpperCase();
};

const menuItems = computed<Array<Array<DropdownMenuItem>>>(() => {
	if (!user.value) {
		return [
			[
				{
					label: t("UserPanel.login"),
					icon: "i-lucide-log-in",
					to: localePath("/login"),
				},
			],
		];
	}

	const groups: Array<Array<DropdownMenuItem>> = [];

	if (user.value.username) {
		groups.push([{ label: user.value.username, type: "label" }]);
	}

	groups.push(
		[
			{
				label: t("UserPanel.profile"),
				icon: "i-lucide-user",
				to: localePath("/profile"),
			},
			{
				label: t("UserPanel.admin"),
				icon: "i-lucide-panel-left",
				to: localePath("/admin/articles"),
			},
		],
		[
			{
				label: t("UserPanel.logout"),
				icon: "i-lucide-log-out",
				color: "error",
				onSelect: () => {
					void logout();
				},
			},
		],
	);

	return groups;
});
</script>

<template>
	<UDropdownMenu
		:items="menuItems"
		:content="{ align: 'end', sideOffset: 8 }"
		:ui="{ content: 'w-56' }"
	>
		<UButton
			color="neutral"
			variant="solid"
			size="sm"
			square
			class="rounded-full"
			:aria-label="user?.username ?? t('UserPanel.login')"
		>
			<span
				v-if="user?.username"
				class="inline-flex size-5 items-center justify-center text-sm font-semibold leading-none"
			>
				{{ firstLetterUppercase(user.username) }}
			</span>
			<UIcon v-else name="i-lucide-user-round" class="size-5" />
		</UButton>
	</UDropdownMenu>
</template>
