<script lang="ts" setup>
import { ComponentIcon, MapPin, UserRound } from "lucide-vue-next";

const modelValue = defineModel<string>({ default: "Setting" });

const emit = defineEmits<{
	(e: "update:modelValue", value: string): void;
}>();

const activeMode = computed(() => {
	return treeModes.find((m) => m.name === modelValue.value);
});

const treeModes = [
	{ name: "Setting", icon: ComponentIcon },
	{ name: "Ort", icon: MapPin },
	{ name: "Informant", icon: UserRound },
];
</script>

<template>
	<DropdownMenu>
		<DropdownMenuTrigger as-child>
			<Button class="gap-2" size="icon" variant="outline">
				<ClientOnly>
					<Component
						:is="activeMode.icon"
						v-if="activeMode"
						aria-hidden="true"
						class="size-5 shrink-0"
					/>
					<span class="sr-only">Wechsel Modus</span>
				</ClientOnly>
			</Button>
		</DropdownMenuTrigger>
		<DropdownMenuContent>
			<DropdownMenuItem
				v-for="mode of treeModes"
				:key="mode.name"
				class="flex cursor-pointer items-center gap-4"
				@select="
					() => {
						emit('update:modelValue', mode.name);
					}
				"
			>
				<Component :is="mode.icon" class="size-4" />
				{{ mode.name }}
			</DropdownMenuItem>
		</DropdownMenuContent>
	</DropdownMenu>
</template>
