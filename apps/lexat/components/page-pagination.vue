<script setup lang="ts">
const props = defineProps<{
	currentPage: number;
	totalPages: number;
	itemsPerPage: number;
}>();

const totalItems = computed(() => {
	return props.totalPages * props.itemsPerPage;
});

const emit = defineEmits<{
	(event: "update:page", values: number): void;
}>();

const onUpdatePage = (newPage: number) => {
	emit("update:page", newPage);
};
</script>

<template>
	<Pagination
		v-slot="{ page }"
		:default-page="1"
		:items-per-page="itemsPerPage"
		:page="props.currentPage"
		show-edges
		:sibling-count="1"
		:total="totalItems"
		@update:page="onUpdatePage"
	>
		<PaginationContent v-slot="{ items }" class="flex items-center justify-center gap-1">
			<PaginationPrevious />
			<template v-for="(item, index) in items">
				<PaginationItem v-if="item.type === 'page'" :key="index" as-child :value="item.value">
					<Button class="size-10 p-0" :variant="item.value === page ? 'default' : 'outline'">
						{{ item.value }}
					</Button>
				</PaginationItem>
				<PaginationEllipsis v-else :key="item.type" :index="index" />
			</template>

			<PaginationNext />
		</PaginationContent>
	</Pagination>
</template>
