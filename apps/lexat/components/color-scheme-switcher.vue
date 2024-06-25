<script lang="ts" setup>
import { MonitorIcon, MoonIcon, SunIcon } from "lucide-vue-next";

const t = useTranslations();

const colorMode = useColorMode();

const colorSchemes = [
	{ name: "system", icon: MonitorIcon },
	{ name: "light", icon: SunIcon },
	{ name: "dark", icon: MoonIcon },
];
</script>

<template>
	<ClientOnly>
		<DropdownMenu>
			<DropdownMenuTrigger as-child>
				<Button class="gap-2" size="icon" variant="ghost">
					<Component
						:is="colorMode.value === 'dark' ? MoonIcon : SunIcon"
						aria-hidden="true"
						class="size-5 shrink-0"
					/>
					<span class="sr-only">{{ t("ColorSchemeSwitcher.change-color-scheme") }}</span>
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent>
				<DropdownMenuItem
					v-for="colorScheme of colorSchemes"
					:key="colorScheme.name"
					class="flex cursor-pointer items-center gap-4"
					@click="
						() => {
							colorMode.preference = colorScheme.name;
						}
					"
				>
					<component :is="colorScheme.icon" class="size-4" />
					{{ t(`ColorSchemeToggle.color-schemes.${colorScheme.name}`) }}
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	</ClientOnly>
</template>
