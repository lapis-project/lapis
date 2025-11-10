import { createUrl } from "@acdh-oeaw/lib";

interface UsePageMetadataParams {
	title: MaybeRef<string>;
	cover?: MaybeRef<string>;
	description?: MaybeRef<string>;
	url?: MaybeRef<string>;
	contentType?: MaybeRef<string>;
	jsonld?: Record<string, unknown>;
}

export function usePageMetadata(params: UsePageMetadataParams): void {
	const env = useRuntimeConfig();

	useHead({
		title: params.title,
		meta: [
			{ property: "og:title", content: params.title },
			{ property: "twitter:title", content: params.title },
			...(params.description != null
				? [
						{ name: "description", content: params.description },
						{ property: "og:description", content: params.description },
						{ name: "twitter:description", content: params.description },
					]
				: []),
			{ property: "og:type", content: params.contentType ?? "website" },
			{ name: "twitter:card", content: "summary_large_image" },
			{
				property: "og:image",
				content:
					params.cover ??
					String(
						createUrl({
							baseUrl: env.public.appBaseUrl,
							pathname: "/opengraph-image.png",
						}),
					),
			},
			{
				name: "twitter:image",
				content:
					params.cover ??
					String(
						createUrl({
							baseUrl: env.public.appBaseUrl,
							pathname: "/opengraph-image.png",
						}),
					),
			},
			// NOTE: og:locale is already done by i18n
		],
		script:
			params.jsonld && typeof params.jsonld === "object" && Object.keys(params.jsonld).length > 0
				? [
						{
							hid: "breadcrumbs-json-ld",
							type: "application/ld+json",
							textContent: JSON.stringify(params.jsonld),
						},
					]
				: [],
	});
}
