<script setup lang="ts">
const { regionPatterns, getRegionPatternId } = useColorStore();
</script>

<template>
	<svg class="absolute" height="0" width="0">
		<defs>
			<pattern
				v-for="p in regionPatterns"
				:id="getRegionPatternId(p.id)"
				:key="p.id"
				:height="p.h"
				patternUnits="userSpaceOnUse"
				:width="p.w"
			>
				<rect :fill="p.color" fill-opacity="0.15" :height="p.h" :width="p.w" />
				<circle v-if="p.circle" cx="1" cy="1" :fill="p.color" r="1" />
				<path v-else :d="p.path" fill="none" :stroke="p.color" stroke-width="1.2" />
			</pattern>
		</defs>
	</svg>
</template>
