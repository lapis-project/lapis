<script lang="ts" setup>
import { Undo2, CircleQuestionMarkIcon } from "@lucide/vue";

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

function syncFormFromRoute() {
	const query = route.query;
	form.word = Array.isArray(query.word) ? String(query.word[0] ?? "") : String(query.word ?? "");
	form.lemma = Array.isArray(query.lemma)
		? String(query.lemma[0] ?? "")
		: String(query.lemma ?? "");
	form.pos = Array.isArray(query.pos) ? String(query.pos[0] ?? "") : String(query.pos ?? "");
	mode.value = query.mode === "regex" ? "regex" : "simple";
}

function updateRoute() {
	const hasAnyField = Boolean(form.word || form.lemma || form.pos);

	router.replace({
		query: {
			...route.query,
			word: hasAnyField ? form.word || undefined : undefined,
			lemma: hasAnyField ? form.lemma || undefined : undefined,
			pos: hasAnyField ? form.pos || undefined : undefined,
			mode: hasAnyField ? mode.value : undefined,
			page: hasAnyField ? "1" : undefined,
			fromp: hasAnyField ? 0 : undefined,
		},
	});
}

function handleSearch() {
	updateRoute();
	emit("search");
}

function clearField(field: "word" | "lemma" | "pos") {
	form[field] = "";
	const hasAnyField = Boolean(form.word || form.lemma || form.pos);

	router.replace({
		query: {
			...route.query,
			[field]: undefined,
			mode: hasAnyField ? mode.value : undefined,
			page: hasAnyField ? "1" : undefined,
			fromp: hasAnyField ? 0 : undefined,
		},
	});
}

onMounted(() => {
	syncFormFromRoute();
});

watch(
	() => route.query.word,
	() => syncFormFromRoute(),
);

watch(
	() => route.query.lemma,
	() => syncFormFromRoute(),
);

watch(
	() => route.query.pos,
	() => syncFormFromRoute(),
);

watch(
	() => route.query.mode,
	() => syncFormFromRoute(),
);
</script>

<template>
	<div class="flex flex-row gap-6 h-full justify-center">
		<form
			class="rounded-lg pt-4 flex flex-col gap-4 w-full max-w-md"
			@submit.prevent="handleSearch"
		>
			<div class="grid grid-rows-3 gap-4">
				<div class="flex flex-col gap-1">
					<Label>Wordform</Label>
					<div class="flex gap-2">
						<Input v-model="form.word" placeholder="zB. gehen" />
						<Button type="button" size="icon" variant="outline" @click="clearField('word')">
							<Undo2 class="size-4" />
						</Button>
					</div>
				</div>

				<div class="flex flex-col gap-1">
					<Label>Lemma</Label>
					<div class="flex gap-2">
						<Input v-model="form.lemma" placeholder="zB. gehen" />
						<Button type="button" size="icon" variant="outline" @click="clearField('lemma')">
							<Undo2 class="size-4" />
						</Button>
					</div>
				</div>

				<div class="flex flex-col gap-1">
					<div class="flex flex-row gap-2">
						<Label>POS</Label>
						<TooltipProvider>
							<Tooltip>
								<TooltipTrigger as-child>
									<CircleQuestionMarkIcon :size="16" class="text-gray-400 hover:text-gray-500" />
								</TooltipTrigger>
								<TooltipContent> Part-of-speech </TooltipContent>
							</Tooltip>
						</TooltipProvider>
					</div>
					<div class="flex gap-2">
						<Input v-model="form.pos" placeholder="zB. VERB" />
						<Button type="button" size="icon" variant="outline" @click="clearField('pos')">
							<Undo2 class="size-4" />
						</Button>
					</div>
				</div>
			</div>

			<Separator></Separator>
			<div class="flex items-center my-3">
				<div class="flex gap-2 w-full justify-center">
					<Button
						type="button"
						size="sm"
						:variant="mode === 'simple' ? 'default' : 'ghost'"
						@click="mode = 'simple'"
					>
						Simple
					</Button>

					<Button
						type="button"
						size="sm"
						:variant="mode === 'regex' ? 'default' : 'ghost'"
						@click="mode = 'regex'"
					>
						Regex
					</Button>
				</div>
			</div>
			<Button type="submit"> Suchen </Button>
		</form>
	</div>
</template>
