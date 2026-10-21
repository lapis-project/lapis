import { defineStore } from "pinia";

import type { VariantGroup } from "#layers/ui/app/utils/variant-groups";
import { datasetScopedKey } from "@/utils/dataset";

export const useVariantGroupStore = defineStore("variantGroups", () => {
	const datasetStore = useDatasetStore();
	const groupsByMap = ref<Record<string, Record<string, Array<VariantGroup>>>>({});

	function scopedKey(mapId: string, question: string) {
		return datasetScopedKey(datasetStore.datasetForMap(mapId), question);
	}

	/** Empty for a map or question without a grouping, which reads as "nothing is grouped". */
	function getGroupsForMap(mapId: string, question: string) {
		return groupsByMap.value[mapId]?.[scopedKey(mapId, question)] ?? [];
	}

	function setGroupsForMap(mapId: string, question: string, groups: Array<VariantGroup>) {
		const groupsByQuestion = (groupsByMap.value[mapId] ??= {});
		groupsByQuestion[scopedKey(mapId, question)] = groups;
	}

	function groupsForMap(mapId: string, question: () => string) {
		return computed({
			get() {
				return getGroupsForMap(mapId, question());
			},
			set(groups: Array<VariantGroup>) {
				setGroupsForMap(mapId, question(), groups);
			},
		});
	}

	return {
		groupsForMap,
		getGroupsForMap,
		setGroupsForMap,
	};
});
