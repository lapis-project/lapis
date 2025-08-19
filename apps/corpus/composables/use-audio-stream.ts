import type { InferResponseType } from "hono/client";

import { useApiClient } from "@/composables/use-api-client";

export function useAudioStream() {
	const env = useRuntimeConfig();

	const { apiClient } = useApiClient();
	const _getAudioStream = apiClient.audio.audio[":filename"].$get;
	type APIAudioStream = InferResponseType<typeof _getAudioStream, 200>;

	const currentFilename = ref("returnofsherlockholmes");
	const fetchAudioStream = async (timeStamp: string) => {
		try {
			const response = await $fetch<APIAudioStream>(`/audio/audio/${currentFilename.value}`, {
				query: {},
				baseURL: env.public.apiBaseUrl,
				method: "GET",
				credentials: "include",
				// immediate: false,
			});
			console.log(response);
		} catch (err) {
			console.error(err);
		}
	};

	const setCurrentFilename = (newValue: string) => {
		if (currentFilename.value !== newValue) {
			currentFilename.value = newValue;
		}
	};

	return {
		currentFilename,
		setCurrentFilename,
		fetchAudioStream,
	};
}
