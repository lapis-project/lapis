import type { AppType } from "@lapis/backend/api";
import { hc } from "hono/client";

function createApiClient(apiBaseUrl: string) {
	return hc<AppType>(apiBaseUrl);
}

export type ApiClient = ReturnType<typeof createApiClient>;

export function useApiClient() {
	const env = useRuntimeConfig();
	const apiBaseUrl = env.public.apiBaseUrl;

	const apiClient = createApiClient(apiBaseUrl);

	return { apiClient };
}
