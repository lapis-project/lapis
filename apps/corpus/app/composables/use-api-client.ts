import type { AppType } from "@lapis/backend/api";
import { hc } from "hono/client";

export function useApiClient() {
	const env = useRuntimeConfig();
	const apiBaseUrl = env.public.apiBaseUrl;

	const apiClient = hc<AppType>(apiBaseUrl);

	return { apiClient };
}
