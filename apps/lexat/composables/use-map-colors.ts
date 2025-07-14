export function useMapColors() {
	const ogColors = [
		"#ff8080",
		"#80ffa5",
		"#ca80ff",
		"#ffef80",
		"#80eaff",
		"#ff80c4",
		"#9fff80",
		"#8580ff",
		"#ffaa80",
		"#80ffcf",
		"#f580ff",
		"#e4ff80",
		"#80bfff",
		"#ff809a",
		"#80ff8a",
		"#b080ff",
	];

	const ogSpecialColors = {
		irrelevant: "#faf9f6",
		sonstige: "#707070",
	};

	const colors = ref([...ogColors]);

	const specialColors = ref({
		...ogSpecialColors,
	});

	const resetColors = () => {
		colors.value = [...ogColors];
		specialColors.value = { ...ogSpecialColors };
	};

	return {
		colors,
		specialColors,
		resetColors,
	};
}
