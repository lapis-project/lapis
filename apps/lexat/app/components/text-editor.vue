<!-- eslint-disable import-x/no-named-as-default -->
<script setup lang="ts">
import CharacterCount from "@tiptap/extension-character-count";
import Image from "@tiptap/extension-image";
import Link from "@tiptap/extension-link";
import { TableKit } from "@tiptap/extension-table";
import TextAlign from "@tiptap/extension-text-align";
import Underline from "@tiptap/extension-underline";
import type { Level } from "@tiptap/pm";
import StarterKit from "@tiptap/starter-kit";
import { Editor, EditorContent } from "@tiptap/vue-3";
import type { InferResponseType } from "hono/client";
import {
	AlignCenterIcon,
	AlignJustifyIcon,
	AlignLeftIcon,
	AlignRightIcon,
	BoldIcon,
	ImagePlusIcon,
	ItalicIcon,
	LinkIcon,
	ListIcon,
	ListOrderedIcon,
	RedoIcon,
	StrikethroughIcon,
	TableIcon,
	UnderlineIcon,
	UndoIcon,
} from "lucide-vue-next";
import { computed, onBeforeUnmount, ref, watch } from "vue";
import { toast } from "vue-sonner";

import { Figure } from "./figure.ts";

const env = useRuntimeConfig();
const { apiClient } = useApiClient();

const _uploadMedia = apiClient.media.upload.$post;
type APIMediaUploadResponse = InferResponseType<typeof _uploadMedia, 200>;

const props = withDefaults(defineProps<{ modelValue?: string }>(), {
	modelValue: "",
});

const addTableHeader = ref<boolean>(false);
const dropdownOpen = ref(false);
const dropbtn = ref<HTMLButtonElement | null>(null);
const isLinkDialogOpen = ref<boolean>(false);
const isImageDialogOpen = ref<boolean>(false);
const isTableDialogOpen = ref<boolean>(false);
const urlInput = ref<string>("");
const imageAnnotation = ref<string>("");
const imageMapLink = ref<string>("");
const imageAltText = ref<string>("");
const selectedImage = ref<File | null>(null);
const tableColumns = ref(3);
const tableRows = ref(3);

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
			Image,
			Figure,
			TableKit,
		],
		onUpdate: () => {
			emit("update:modelValue", editor.value.getHTML());
		},
		editorProps: {
			// https://www.codemzy.com/blog/tiptap-pasting-images
			transformPastedHTML(html) {
				// remove any non self-hosted images on paste
				return html.replace(/<img[^>]*\ssrc="([^"]+)"[^>]*>/g, (match, imgSrc) => {
					if (imgSrc.startsWith("https://imgproxy-test.acdh-ch-dev.oeaw.ac.at/")) {
						return match;
					}
					return "";
				});
			},
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
	{ slug: "image", icon: ImagePlusIcon, active: "image" },
	{ slug: "table", icon: TableIcon, active: "table" },
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

const handleTableInsert = () => {
	editor.value.commands.insertTable({
		rows: tableRows.value,
		cols: tableColumns.value,
		withHeaderRow: addTableHeader.value,
	});
	tableRows.value = 3;
	isTableDialogOpen.value = false;
};

type ActionSlug =
	| "align"
	| "bold"
	| "bulletList"
	| "clear"
	| "code"
	| "italic"
	| "link"
	| "image"
	| "orderedList"
	| "redo"
	| "strike"
	| "table"
	| "underline"
	| "undo";

const setLink = () => {
	isLinkDialogOpen.value = false;
	if (urlInput.value === "") {
		editor.value.chain().focus().extendMarkRange("link").unsetLink().run();

		return;
	}
	// update link
	editor.value.chain().focus().extendMarkRange("link").setLink({ href: urlInput.value }).run();
	urlInput.value = "";
};

const insertImage = (url: string) => {
	editor.value
		.chain()
		.focus()
		.setFigure({
			src: url,
			alt: imageAltText.value,
			title: imageAnnotation.value,
			caption: imageAnnotation.value,
		})
		.run();
};

const handleImageUpload = async () => {
	if (!selectedImage.value) {
		toast.error("No image selected");
		return;
	}

	const formData = new FormData();
	formData.append("image", selectedImage.value);

	try {
		const result = await $fetch<APIMediaUploadResponse>("/media/upload", {
			baseURL: env.public.apiBaseUrl,
			credentials: "include",
			body: formData,
			method: "POST",
		});
		insertImage(result.imageUrl);
		isImageDialogOpen.value = false;
		imageAnnotation.value = "";
		imageMapLink.value = "";
		imageAltText.value = "";
	} catch (e) {
		if (env.NODE_ENV !== "production") {
			console.error(e);
		}
		toast.error("Could not upload image");
	}
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
			isLinkDialogOpen.value = true;
		},
		image: () => {
			isImageDialogOpen.value = true;
		},
		table: () => {
			isTableDialogOpen.value = true;
		},
	};

	actionTriggers[slug]();
};

const onHeadingClick = (index: Level) => {
	const vm = editor.value.chain().focus();
	vm.toggleHeading({ level: index }).run();
	toggleDropdown();
};

const handleFileChange = (event: Event) => {
	const target = event.target as HTMLInputElement;
	const file = target.files?.[0];
	if (file) {
		selectedImage.value = file;
	}
};
</script>

<template>
	<div id="text-editor" class="border border-foreground">
		<div v-if="editor" class="toolbar flex items-center border-b border-b-foreground">
			<div class="align-dropdown relative m-2 inline-block">
				<button
					ref="dropbtn"
					:aria-expanded="dropdownOpen"
					aria-haspopup="true"
					aria-label="Submenu of headings"
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
					@keydown.down.prevent="focusNext"
					@keydown.escape.prevent="closeDropdown"
					@keydown.up.prevent="focusPrevious"
				>
					<div
						v-for="index in [2, 3, 4, 5, 6]"
						:key="index"
						:class="{ active: editor.isActive('heading', { level: index }) }"
						role="menuitem"
						:style="{ fontSize: 20 - index + 'px' }"
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

		<EditorContent class="article-content h-[500px] overflow-y-auto px-3" :editor="editor" />

		<div v-if="editor" class="p-2 text-right text-sm">
			<span class="words-count"> {{ wordsCount }} words </span>
		</div>

		<Dialog :open="isLinkDialogOpen" @update:open="(newVal) => (isLinkDialogOpen = newVal)">
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Add Link</DialogTitle>
				</DialogHeader>
				<div class="grid grid-cols-4 items-center gap-4 py-4">
					<Label class="text-right" for="url"> URL </Label>
					<Input id="url" v-model="urlInput" class="col-span-3" />
				</div>

				<DialogFooter>
					<Button :disabled="!urlInput" @click="setLink">Insert</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>

		<Dialog :open="isImageDialogOpen" @update:open="(newVal) => (isImageDialogOpen = newVal)">
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Add Image</DialogTitle>
				</DialogHeader>
				<div class="grid w-full max-w-sm items-center gap-1.5">
					<Label for="image">Image</Label>
					<Input
						id="image"
						accept="image/jpeg, image/png, image/svg+xml"
						type="file"
						@change="handleFileChange"
					/>
				</div>
				<div class="grid w-full max-w-sm items-center gap-1.5">
					<Label for="alt-text">Alt text</Label>
					<Input
						id="alt-text"
						v-model="imageAltText"
						class="col-span-3"
						placeholder="Beschreibung des Bildinhalts"
					/>
				</div>
				<div class="grid w-full max-w-sm items-center gap-1.5">
					<Label for="annotation">Annotation</Label>
					<Input
						id="annotation"
						v-model="imageAnnotation"
						class="col-span-3"
						placeholder="Annotation unterhalb des Bildes"
					/>
				</div>
				<!-- <div class="grid w-full max-w-sm items-center gap-1.5">
					<Label for="annotation">Link zur Kartierung</Label>
					<Input id="annotation" v-model="imageMapLink" class="col-span-3" />
				</div> -->

				<DialogFooter>
					<Button @click="handleImageUpload"> Insert </Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>

		<Dialog :open="isTableDialogOpen" @update:open="(newVal) => (isTableDialogOpen = newVal)">
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Add Table</DialogTitle>
				</DialogHeader>
				<div class="flex gap-4">
					<NumberField id="tableRows" v-model="tableRows" :min="1">
						<Label for="tableRows">Rows</Label>
						<NumberFieldContent>
							<NumberFieldDecrement />
							<NumberFieldInput />
							<NumberFieldIncrement />
						</NumberFieldContent>
					</NumberField>
					<NumberField id="tableColums" v-model="tableColumns" :min="1">
						<Label for="tableColums">Columns</Label>
						<NumberFieldContent>
							<NumberFieldDecrement />
							<NumberFieldInput />
							<NumberFieldIncrement />
						</NumberFieldContent>
					</NumberField>
				</div>
				<div class="flex gap-2 rounded border px-3 py-2 items-center">
					<Checkbox id="tableHeader" v-model="addTableHeader" />
					<label
						class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
						for="tableHeader"
					>
						Add Header
					</label>
				</div>
				<DialogFooter>
					<Button @click="handleTableInsert"> Insert </Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	</div>
</template>

<style lang="css" scoped>
.article-content :deep(.tiptap:focus-visible) {
	outline: none;
}
</style>
