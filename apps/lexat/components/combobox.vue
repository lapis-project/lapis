<script setup lang="ts">
import { Check, ChevronsUpDown } from "lucide-vue-next";
import { ref } from "vue";

import { Button } from "@/components/ui/button";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/utils/styles";

const frameworks = [
	{ value: "next.js", label: "Next.js" },
	{ value: "sveltekit", label: "SvelteKit" },
	{ value: "nuxt.js", label: "Nuxt.js" },
	{ value: "remix", label: "Remix" },
	{ value: "astro", label: "Astro" },
];

const open = ref(false);
const value = ref("");
</script>

<template>
	<Popover v-model:open="open">
		<PopoverTrigger as-child>
			<Button
				variant="outline"
				role="combobox"
				:aria-expanded="open"
				aria-controls="popover-content"
				class="w-[200px] justify-between"
			>
				{{
					value
						? frameworks.find((framework) => framework.value === value)?.label
						: "Select question..."
				}}
				<ChevronsUpDown class="ml-2 size-4 shrink-0 opacity-50" />
			</Button>
		</PopoverTrigger>
		<PopoverContent id="popover-content" class="w-[200px] p-0" role="listbox">
			<Command>
				<CommandInput class="h-9" placeholder="Search question..." />
				<CommandEmpty>No question found.</CommandEmpty>
				<CommandList>
					<CommandGroup>
						<CommandItem
							v-for="framework in frameworks"
							:key="framework.value"
							:value="framework.value"
							@select="
								(ev) => {
									if (typeof ev.detail.value === 'string') {
										value = ev.detail.value;
									}
									open = false;
								}
							"
						>
							{{ framework.label }}
							<Check
								:class="
									cn('ml-auto h-4 w-4', value === framework.value ? 'opacity-100' : 'opacity-0')
								"
							/>
						</CommandItem>
					</CommandGroup>
				</CommandList>
			</Command>
		</PopoverContent>
	</Popover>
</template>