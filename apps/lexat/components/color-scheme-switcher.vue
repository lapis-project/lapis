<script lang="ts" setup>
import { ComputerDesktopIcon, MoonIcon, SunIcon } from "@heroicons/vue/24/solid";

const t = useTranslations();

const colorMode = useColorMode();

const colorSchemes = [
	{ name: "system", icon: ComputerDesktopIcon },
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
					<Component :is="colorScheme.icon" class="size-4" />
					{{ t(`ColorSchemeSwitcher.color-schemes.${colorScheme.name}`) }}
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	</ClientOnly>
</template>
