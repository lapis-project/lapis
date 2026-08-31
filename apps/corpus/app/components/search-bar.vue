<script lang="ts" setup>
import { SearchIcon } from "@lucide/vue";

const router = useRouter();
const route = useRoute();

const emit = defineEmits<{ search: [category: string, value: string] }>();

const searchInput = ref("");

const selectedCategory = ref("transcript_name");

const categories = [
	{ label: "Name", value: "transcript_name" },
	{ label: "ID", value: "instance_id" },
];

watch(
	() => {
		return searchInput.value;
	},
	() => {
		router.replace({
			query: {
				...route.query,
				category: selectedCategory.value,
				search: searchInput.value,
			},
		});
	},
);
</script>

<template>
	<form class="flex gap-4 items-end flex-shrink-0">
		<Label class="sr-only" for="search">Suche</Label>

		<div class="grid grid-cols-[auto_1fr_auto] items-center gap-4">
			<BaseSelect id="categories" v-model="selectedCategory" :options="categories" />
			<div class="relative w-90">
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
		</div>
	</form>
</template>
