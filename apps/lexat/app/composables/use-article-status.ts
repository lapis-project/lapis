export type Status = "Draft" | "Published" | "ReadyToPublish" | "Unpublished";

export function useArticleStatus() {
	const t = useTranslations();

	// color palette reference: https://www.color-hex.com/color-palette/35021
	const statusOptions = [
		{
			value: "Draft",
			label: t("AdminPage.editor.status.draft"),
			color: "#cc3232", // red
		},
		{
			value: "ReadyToPublish",
			label: t("AdminPage.editor.status.ready"),
			color: "#e7b416", // yellow
		},
		{
			value: "Published",
			label: t("AdminPage.editor.status.published"),
			color: "#2dc937", // green
		},
		{
			value: "Unpublished",
			label: t("AdminPage.editor.status.unpublished"),
			color: "#d3d3d3", // grey
		},
	];

	return {
		statusOptions,
	};
}
