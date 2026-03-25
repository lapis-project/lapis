<template>
	<div>
		<div class="flex gap-1.5 items-end group">
			<slot />

			<NuxtLink
				class="text-xs border inline px-1.5 py-0.5 leading-none font-bold text-gray-500 dark:text-gray-400 hover:text-accent-foreground transition-colors duration-200 uppercase tracking-widest no-underline"
				external
				raw
				target="_blank"
				to="https://www.oeaw.ac.at/de/acdh/forschung/sprachwissenschaft/forschung/korpuslinguistik/lapis-linguae-austriacae"
			>
				LAPIS
			</NuxtLink>
		</div>
	</div>
</template>
