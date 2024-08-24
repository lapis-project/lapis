<!-- eslint-disable import-x/no-named-as-default -->
<script setup lang="ts">
import CharacterCount from "@tiptap/extension-character-count";
import Link from "@tiptap/extension-link";
import TextAlign from "@tiptap/extension-text-align";
import Underline from "@tiptap/extension-underline";
import type { Level } from "@tiptap/pm";
import StarterKit from "@tiptap/starter-kit";
import { Editor, EditorContent } from "@tiptap/vue-3";
import {
	AlignCenterIcon,
	AlignJustifyIcon,
	AlignLeftIcon,
	AlignRightIcon,
	BoldIcon,
	ItalicIcon,
	LinkIcon,
	ListIcon,
	ListOrderedIcon,
	RedoIcon,
	StrikethroughIcon,
	UnderlineIcon,
	UndoIcon,
} from "lucide-vue-next";
import { computed, onBeforeUnmount, ref, watch } from "vue";

export interface Props {
	modelValue: string;
}

const props = withDefaults(defineProps<Props>(), {
	modelValue: "",
});

const dropdownOpen = ref(false);
const dropbtn = ref<HTMLButtonElement | null>(null);
const isOpen = ref<boolean>(false);
const urlInput = ref<string>("");

const emit = defineEmits<{
	(e: "update:modelValue", value: string): void;
}>();

const editor = ref(
	new Editor({
		content: props.modelValue,
		extensions: [
			StarterKit,
			Underline,
			TextAlign.configure({
				types: ["heading", "paragraph"],
			}),
			CharacterCount,
			Link,
		],
		onUpdate: () => {
			emit("update:modelValue", editor.value.getHTML());
		},
	}),
);

const textActions = ref([
	{ slug: "bold", icon: BoldIcon, active: "bold" },
	{ slug: "italic", icon: ItalicIcon, active: "italic" },
	{ slug: "underline", icon: UnderlineIcon, active: "underline" },
	{ slug: "strike", icon: StrikethroughIcon, active: "strike" },
	{
		slug: "align",
		option: "left",
		icon: AlignLeftIcon,
		active: { textAlign: "left" },
	},
	{
		slug: "align",
		option: "center",
		icon: AlignCenterIcon,
		active: { textAlign: "center" },
	},
	{
		slug: "align",
		option: "right",
		icon: AlignRightIcon,
		active: { textAlign: "right" },
	},
	{
		slug: "align",
		option: "justify",
		icon: AlignJustifyIcon,
		active: { textAlign: "justify" },
	},
	{ slug: "bulletList", icon: ListIcon, active: "bulletList" },
	{ slug: "orderedList", icon: ListOrderedIcon, active: "orderedList" },
	{ slug: "undo", icon: UndoIcon, active: "undo" },
	{ slug: "redo", icon: RedoIcon, active: "redo" },
	{ slug: "link", icon: LinkIcon, active: "link" },
]);

const wordsCount = computed(() => {
	return editor.value.storage.characterCount.words();
});

watch(
	() => props.modelValue,
	(newContent: string) => {
		if (editor.value.getHTML() === newContent) {
			return;
		}
		editor.value.commands.setContent(newContent, false);
	},
);

onBeforeUnmount(() => {
	editor.value.destroy();
});

const toggleDropdown = () => {
	dropdownOpen.value = !dropdownOpen.value;
};

const closeDropdown = () => {
	dropdownOpen.value = false;
	dropbtn.value?.focus();
};

const focusNext = (event: KeyboardEvent) => {
	const current = event.target as HTMLElement;
	const next = current.nextElementSibling as HTMLElement | null;
	if (next) {
		next.focus();
	}
};

const focusPrevious = (event: KeyboardEvent) => {
	const current = event.target as HTMLElement;
	const previous = current.previousElementSibling as HTMLElement | null;
	if (previous) {
		previous.focus();
	}
};

type ActionSlug =
	| "align"
	| "bold"
	| "bulletList"
	| "clear"
	| "code"
	| "italic"
	| "orderedList"
	| "redo"
	| "strike"
	| "underline"
	| "undo";

const setLink = () => {
	isOpen.value = false;
	if (urlInput.value === "") {
		editor.value.chain().focus().extendMarkRange("link").unsetLink().run();

		return;
	}
	// update link
	editor.value.chain().focus().extendMarkRange("link").setLink({ href: urlInput.value }).run();
};

const onActionClick = (slug: ActionSlug, option = "left") => {
	const vm = editor.value.chain().focus();
	const actionTriggers = {
		bold: () => vm.toggleBold().run(),
		italic: () => vm.toggleItalic().run(),
		underline: () => vm.toggleUnderline().run(),
		strike: () => vm.toggleStrike().run(),
		bulletList: () => vm.toggleBulletList().run(),
		orderedList: () => vm.toggleOrderedList().run(),
		align: () => vm.setTextAlign(option).run(),
		undo: () => vm.undo().run(),
		redo: () => vm.redo().run(),
		clear: () => {
			vm.clearNodes().run();
			vm.unsetAllMarks().run();
		},
		code: () => vm.toggleCodeBlock().run(),
		link: () => {
			isOpen.value = true;
		},
	};

	actionTriggers[slug]();
};

const onHeadingClick = (index: Level) => {
	const vm = editor.value.chain().focus();
	vm.toggleHeading({ level: index }).run();
	toggleDropdown();
};
</script>

<template>
	<div id="text-editor" class="border border-foreground">
		<div v-if="editor" class="toolbar flex items-center border-b border-b-foreground">
			<div class="align-dropdown relative m-2 inline-block">
				<button
					ref="dropbtn"
					aria-label="Submenu of headings"
					:aria-expanded="dropdownOpen"
					class="dropbtn"
					aria-haspopup="true"
					@click="toggleDropdown"
					@keydown.enter.prevent="toggleDropdown"
					@keydown.space.prevent="toggleDropdown"
				>
					Heading ▼
				</button>
				<!-- eslint-disable-next-line vuejs-accessibility/interactive-supports-focus -->
				<div
					v-if="dropdownOpen"
					class="dropdown-content"
					role="menu"
					@keydown.escape.prevent="closeDropdown"
					@keydown.down.prevent="focusNext"
					@keydown.up.prevent="focusPrevious"
				>
					<div
						v-for="index in 6"
						:key="index"
						:class="{ active: editor.isActive('heading', { level: index }) }"
						:style="{ fontSize: 20 - index + 'px' }"
						role="menuitem"
						tabindex="0"
						@click="onHeadingClick(index)"
						@keyup.enter.prevent="onHeadingClick(index)"
					>
						H{{ index }}
					</div>
				</div>
			</div>

			<button
				v-for="({ slug, option, active, icon }, index) in textActions"
				:key="index"
				:class="{ active: editor.isActive(active) }"
				@click="onActionClick(slug as ActionSlug, option)"
			>
				<component :is="icon" class="size-4" />
			</button>
		</div>

		<EditorContent :editor="editor" class="px-3" />

		<div v-if="editor" class="p-2 text-right text-sm">
			<span class="words-count"> {{ wordsCount }} words </span>
		</div>

		<Dialog :open="isOpen" @update:open="(newVal) => (isOpen = newVal)">
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Add Link</DialogTitle>
				</DialogHeader>
				<div class="grid grid-cols-4 items-center gap-4 py-4">
					<Label for="url" class="text-right"> URL </Label>
					<Input id="url" v-model="urlInput" class="col-span-3" />
				</div>

				<DialogFooter>
					<Button :disabled="!urlInput" @click="setLink">Save changes</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	</div>
</template>
