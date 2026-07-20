export default defineAppConfig({
	ui: {
		button: {
			compoundVariants: [
				{ variant: "solid", class: "focus-visible:outline-none" },
				{ variant: "outline", class: "ring-0 focus-visible:ring-0 border border-border" },
				{ variant: "subtle", class: "ring-0 focus-visible:ring-0" },
				{ variant: "link", class: "focus-visible:ring-0" },
			],
		},
	},
});
