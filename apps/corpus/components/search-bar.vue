<script lang="ts" setup>
import { SearchIcon } from "lucide-vue-next";

const searchInput = ref("");
</script>

<template>
	<form class="flex gap-4 items-end flex-shrink-0">
		<Label class="sr-only" for="search">Suche</Label>
		<div class="relative w-64">
			<Input
				id="search"
				v-model="searchInput"
				class="pl-10"
				placeholder="Suchbegriff eingeben"
				type="text"
			/>
			<span class="absolute inset-y-0 start-0 flex items-center justify-center px-2">
				<SearchIcon class="size-6 text-muted-foreground" />
			</span>
		</div>
		<Button type="submit"> Suchen </Button>
	</form>
</template>
