export default defineAppConfig({
	ui: {
		colors: {
			primary: "teal",
			neutral: "neutral",
		},
		pageGrid: {
			base: "relative grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-8",
		},
		pageAside: {
			slots: {
				root: "hidden overflow-y-auto lg:block lg:max-h-[calc(100vh-var(--ui-header-height))] lg:sticky lg:top-(--ui-header-height) py-8 lg:ps-4 lg:-ms-4 lg:pe-6.5",
				container: "relative",
				top: "sticky -top-8 -mt-8 pointer-events-none z-[1]",
				topHeader: "h-8 bg-default -mx-4 px-4",
				topBody: "bg-default relative pointer-events-auto flex flex-col -mx-4 px-4",
				topFooter: "h-8 bg-gradient-to-b from-default -mx-4 px-4",
			},
		},
		user: {
			slots: {
				root: "relative group/user",
				wrapper: "",
				name: "font-medium",
				description: "text-muted",
				avatar: "shrink-0",
			},
			variants: {
				orientation: {
					horizontal: {
						root: "flex flex-row items-center sm:flex-col",
					},
					vertical: {
						root: "flex flex-col items-center",
					},
				},
				to: {
					true: {
						name: [
							"text-default peer-hover:text-highlighted peer-focus-visible:text-highlighted",
							"transition-colors",
						],
						description: [
							"peer-hover:text-toned peer-focus-visible:text-toned",
							"transition-colors",
						],
						avatar:
							"transform transition-transform duration-200 group-hover/user:scale-115 group-has-focus-visible/user:scale-115",
					},
					false: {
						name: "text-highlighted",
						description: "",
					},
				},
				size: {
					"3xs": {
						root: "gap-1",
						wrapper: "flex items-center gap-1",
						name: "text-xs",
						description: "text-xs",
					},
					"2xs": {
						root: "gap-1.5",
						wrapper: "flex items-center gap-1.5",
						name: "text-xs",
						description: "text-xs",
					},
					xs: {
						root: "gap-1.5",
						wrapper: "flex items-center gap-1.5",
						name: "text-xs",
						description: "text-xs",
					},
					sm: {
						root: "gap-2",
						name: "text-xs",
						description: "text-xs",
					},
					md: {
						root: "gap-2",
						name: "text-sm",
						description: "text-xs",
					},
					lg: {
						root: "gap-2.5",
						name: "text-sm",
						description: "text-sm",
					},
					xl: {
						root: "gap-2.5",
						name: "text-base",
						description: "text-sm",
					},
					"2xl": {
						root: "gap-3",
						name: "text-base text-left sm:text-center",
						description: "text-base text-left sm:text-center",
					},
					"3xl": {
						root: "gap-3",
						name: "text-lg",
						description: "text-base",
					},
				},
			},
			defaultVariants: {
				size: "md",
			},
		},
		main: {
			base: "min-h-0 flex-1 flex flex-col",
		},
	},
});
