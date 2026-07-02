<script setup lang="ts">
import { X } from "@lucide/vue";

import { useSidebar } from "../../../shadcn/app/components/ui/sidebar";

const { toggleSidebar } = useSidebar();
const t = useTranslations();
</script>

<template>
	<Sidebar
		class="top-14 h-[calc(100svh-3.5rem)] sm:top-16 sm:h-[calc(100svh-4rem)] shadow-lg"
		side="right"
		variant="inset"
	>
		<SidebarHeader class="pb-0">
			<SidebarGroup class="border-b border-border flex-row justify-between">
				<SidebarGroupLabel>{{ t("MapsPage.sidebar.labels.data-insights") }}</SidebarGroupLabel>
				<Button class="size-6 p-1 m-1 text-muted-foreground" variant="ghost" @click="toggleSidebar">
					<X></X>
				</Button>
			</SidebarGroup>
		</SidebarHeader>
		<SidebarContent>
			<SidebarGroup>
				<SidebarGroupContent>
					<Tabs default-value="phenomenon">
						<TabsList
							class="w-full h-auto items-stretch justify-start gap-0 rounded-none border-b border-border bg-transparent p-0"
						>
							<TabsTrigger
								class="h-auto flex-1 items-center whitespace-normal rounded-none border-0 border-b-2 border-transparent bg-transparent px-1 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground leading-tight shadow-none data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none dark:data-[state=active]:border-foreground dark:data-[state=active]:bg-transparent"
								value="phenomenon"
							>
								{{ t("MapsPage.sidebar.variable") }}
							</TabsTrigger>
							<TabsTrigger
								class="h-auto flex-1 items-center whitespace-normal rounded-none border-0 border-b-2 border-transparent bg-transparent px-1 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground leading-tight shadow-none data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none dark:data-[state=active]:border-foreground dark:data-[state=active]:bg-transparent"
								value="variant"
							>
								{{ t("MapsPage.sidebar.variant") }}
							</TabsTrigger>
							<TabsTrigger
								class="h-auto flex-1 items-center whitespace-normal rounded-none border-0 border-b-2 border-transparent bg-transparent px-1 py-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground leading-tight shadow-none data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:text-foreground data-[state=active]:shadow-none dark:data-[state=active]:border-foreground dark:data-[state=active]:bg-transparent"
								value="region"
							>
								{{ t("MapsPage.sidebar.region") }}
							</TabsTrigger>
						</TabsList>
						<TabsContent value="phenomenon"></TabsContent>
						<TabsContent value="variant"></TabsContent>
						<TabsContent value="region"></TabsContent>
					</Tabs>
				</SidebarGroupContent>
			</SidebarGroup>
		</SidebarContent>
		<SidebarFooter />
		<SidebarRail />
	</Sidebar>
</template>
