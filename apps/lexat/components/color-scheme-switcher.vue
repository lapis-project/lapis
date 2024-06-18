<script lang="ts" setup>
import { ComputerDesktopIcon, MoonIcon, SunIcon } from "@heroicons/vue/24/outline";

const t = useTranslations();

const colorMode = useColorMode();

const colorSchemes = [
	{ name: "system", icon: ComputerDesktopIcon },
	{ name: "light", icon: SunIcon },
	{ name: "dark", icon: MoonIcon },
];
</script>

<template>
	<DropdownMenu>
		<DropdownMenuTrigger as-child>
			<Button class="gap-2" size="icon" variant="ghost">
				<component :is="colorMode.value === 'dark' ? MoonIcon : SunIcon" class="size-6 shrink-0" />
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
				<component :is="colorScheme.icon" class="size-5" />
				{{ t(`ColorSchemeToggle.color-schemes.${colorScheme.name}`) }}
			</DropdownMenuItem>
		</DropdownMenuContent>
	</DropdownMenu>
</template>
