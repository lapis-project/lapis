export const addIdsToHeadings = (htmlContent: string): string => {
	return htmlContent.replace(
		/<(h[1-6])([^>]*)>(.*?)<\/\1>/gi, // Regex to match heading tags
		(_match: string, tagName: string, attrs: string, inner: string): string => {
			// Generate an ID based on the inner text of the heading
			const text = inner.replace(/<[^>]+>/g, ""); // Strip inner HTML tags
			const id = text
				.toLowerCase()
				.trim()
				.replace(/\s+/g, "-")
				.replace(/[^a-z0-9-]/g, ""); // Clean non-alphanumeric characters

			// if the heading already has an id, leave it untouched
			if (/\sid=(['"])[^'"]*\1/i.test(attrs)) {
				return `<${tagName}${attrs}>${inner}</${tagName}>`;
			}

			// Add the ID to the heading tag
			return `<${tagName} id="${id}"${attrs}>${inner}</${tagName}>`;
		},
	);
};
