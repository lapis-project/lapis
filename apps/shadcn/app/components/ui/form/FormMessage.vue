<script lang="ts" setup>
import { ErrorMessage } from "vee-validate";
import { type HTMLAttributes, toValue } from "vue";

import { cn } from "@/utils/styles";

import { useFormField } from "./useFormField";

const props = defineProps<{
	class?: HTMLAttributes["class"];
}>();

const { name, formMessageId } = useFormField();
</script>

<template>
	<ErrorMessage
		:id="formMessageId"
		as="p"
		:class="cn('text-destructive text-sm', props.class)"
		data-slot="form-message"
		:name="toValue(name)"
	/>
</template>
