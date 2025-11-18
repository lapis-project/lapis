<script lang="ts" setup>
import type { LabelProps } from "reka-ui";
import type { HTMLAttributes } from "vue";

import { Label } from "@/components/ui/label";
import { cn } from "@/utils/styles";

import { useFormField } from "./useFormField";

const props = defineProps<LabelProps & { class?: HTMLAttributes["class"] }>();

const { error, formItemId } = useFormField();
</script>

<template>
	<Label
		:class="cn('data-[error=true]:text-destructive', props.class)"
		:data-error="!!error"
		data-slot="form-label"
		:for="formItemId"
	>
		<slot />
	</Label>
</template>
