<script lang="ts" setup>
import { reactive, ref, computed } from "vue";

const mode = ref<"simple" | "regex">("simple");

const route = useRoute();
const router = useRouter();

const form = reactive({
	word: "",
	lemma: "",
	pos: "",
});

const emit = defineEmits<{
	(e: "search"): void;
}>();

function handleSearch() {
	router.push({
		query: {
			word: form.word || undefined,
			lemma: form.lemma || undefined,
			pos: form.pos || undefined,
			mode: mode.value,
			page: "1",
			fromp: 0,
		},
	});

	emit("search");
}
</script>

<template>
	<div class="flex flex-col gap-6 h-full">
		<div class="border rounded-lg p-4 flex flex-col gap-4">
			<div class="grid grid-cols-3 gap-4">
				<div class="flex flex-col gap-1">
					<Label>Word</Label>
					<Input v-model="form.word" placeholder="zB. gehen" />
				</div>

				<div class="flex flex-col gap-1">
					<Label>Lemma</Label>
					<Input v-model="form.lemma" placeholder="zB. gehen" />
				</div>

				<div class="flex flex-col gap-1">
					<Label>POS</Label>
					<Input v-model="form.pos" placeholder="zB. VERB" />
				</div>
			</div>

			<Separator></Separator>
			<div class="flex items-center justify-between">
				<div class="flex gap-2">
					<Button
						size="sm"
						:variant="mode === 'simple' ? 'default' : 'ghost'"
						@click="mode = 'simple'"
					>
						Simple
					</Button>

					<Button
						size="sm"
						:variant="mode === 'regex' ? 'default' : 'ghost'"
						@click="mode = 'regex'"
					>
						Regex
					</Button>
				</div>

				<Button @click="handleSearch"> Suchen </Button>
			</div>
		</div>
	</div>
</template>
