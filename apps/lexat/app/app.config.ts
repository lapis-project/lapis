export default defineAppConfig({
	ui: {
		colors: {
			neutral: "zinc",
		},
		header: {
			slots: {
				root: "bg-default/75 backdrop-blur border-b border-default h-(--ui-header-height) sticky top-0 z-50",
				container:
					"max-w-full px-5 sm:max-w-(--breakpoint-sm) sm:px-5 md:max-w-(--breakpoint-md) lg:max-w-(--breakpoint-lg) lg:px-5 xl:max-w-(--breakpoint-xl) 2xl:max-w-(--breakpoint-2xl)",
			},
		},
	},
});
