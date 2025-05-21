<script setup lang="ts">
const enableLU = ref(false);
const enableLemma = ref(false);
const enablePOS = ref(false);
</script>

<template>
	<div class="flex gap-2">
		<div class="flex gap-2 rounded border px-3 py-2 items-center">
			<Checkbox id="enableLU" v-model="enableLU" />

			<label
				class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
				for="enableLU"
			>
				LU
			</label>
		</div>
		<div class="flex gap-2 rounded border px-3 py-2 items-center">
			<Checkbox id="enableLemma" v-model="enableLemma" />

			<label
				class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
				for="enableLemma"
			>
				Lemma
			</label>
		</div>

		<div class="flex gap-2 rounded border px-3 py-2 items-center">
			<Checkbox id="enablePOS" v-model="enablePOS" />

			<label
				class="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
				for="enablePOS"
			>
				POS
			</label>
		</div>
	</div>
</template>
