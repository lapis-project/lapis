export interface StoredSelection {
	question: string;
	variants: Array<string>;
}

export function usePhenomenonSelection() {
	const selectionByMap = useState<Record<string, StoredSelection & { dataset: string }>>(
		"phenomenon-selection",
		() => ({}),
	);

	function getSelection(mapId: string, dataset: string): StoredSelection | undefined {
		const selection = selectionByMap.value[mapId];
		return selection?.dataset === dataset ? selection : undefined;
	}

	function setSelection(mapId: string, dataset: string, selection: StoredSelection) {
		selectionByMap.value[mapId] = { dataset, ...selection, variants: [...selection.variants] };
	}

	return {
		getSelection,
		setSelection,
	};
}
