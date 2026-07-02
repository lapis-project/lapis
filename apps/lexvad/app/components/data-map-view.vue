<script lang="ts" setup>
import { X } from "@lucide/vue";

const t = useTranslations();

const splitMode = ref(true);
const sidebarOpen = ref(false);
</script>

<template>
	<SidebarProvider
		class="min-h-0!"
		:open="sidebarOpen"
		style="--sidebar-width: 25rem"
		@update:open="sidebarOpen = $event"
	>
		<SidebarInset class="shadow-none! min-h-0!">
			<div class="flex gap-5 justify-center relative">
				<SingleMapView
					class="grow shrink"
					:split-mode="splitMode"
					@toggle-compare-mode="splitMode = true"
					@toggle-sidebar="sidebarOpen = !sidebarOpen"
				/>
				<template v-if="splitMode">
					<div class="divide-accent border-l h-150 self-end"></div>
					<SingleMapView
						class="grow shrink"
						:split-mode="splitMode"
						@toggle-sidebar="sidebarOpen = !sidebarOpen"
					/>
					<Button
						class="absolute right-0 top-0 size-6 p-1 m-1 text-muted-foreground"
						variant="ghost"
						@click="splitMode = false"
					>
						<X></X>
						<span class="sr-only">{{ t("MapsPage.controls.close-split-view") }}</span>
					</Button>
				</template>
			</div>
		</SidebarInset>

		<AppSidebar :open="sidebarOpen"></AppSidebar>
	</SidebarProvider>
</template>
