<script setup lang="ts">
import { toTypedSchema } from "@vee-validate/zod";
import { useForm } from "vee-validate";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast/use-toast";

const env = useRuntimeConfig();

const { toast } = useToast();

const t = useTranslations();

const formSchema = toTypedSchema(
	z.object({
		username: z.string().min(2).max(50),
		password: z.string().min(8),
	}),
);

const { handleSubmit } = useForm({
	validationSchema: formSchema,
});

const onSubmit = handleSubmit(async (formValues) => {
	try {
		const response = await $fetch("/auth/login", {
			baseURL: env.public.apiBaseUrl,
			method: "POST",
			body: {
				...formValues,
			},
		});
		if (response) {
			await navigateTo("/admin");
		}
	} catch (error) {
		toast({
			title: "Login failed",
			description: error || "Login failed",
			variant: "destructive",
		});
	}
});
</script>

<template>
	<form class="w-2/3 space-y-6" @submit="onSubmit">
		<FormField v-slot="{ componentField }" name="username">
			<FormItem>
				<FormLabel>{{ t("Auth.username") }}</FormLabel>
				<FormControl>
					<Label for="username" class="sr-only">{{ t("Auth.username") }}</Label>
					<Input
						id="username"
						type="text"
						:placeholder="t('Auth.username')"
						v-bind="componentField"
					/>
				</FormControl>
				<FormMessage />
			</FormItem>
		</FormField>

		<FormField v-slot="{ componentField }" name="password">
			<FormItem>
				<FormLabel>{{ t("Auth.password") }}</FormLabel>
				<FormControl>
					<Label for="password" class="sr-only">{{ t("Auth.password") }}</Label>
					<Input
						id="password"
						type="password"
						:placeholder="t('Auth.password')"
						v-bind="componentField"
					/>
				</FormControl>
				<FormMessage />
			</FormItem>
		</FormField>
		<Button type="submit"> Submit </Button>
		<Toaster />
	</form>
</template>
