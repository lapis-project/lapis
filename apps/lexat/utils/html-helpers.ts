export const addIdsToHeadings = (htmlContent: string): string => {
	return htmlContent.replace(
		/<(h[1-6])([^>]*)>(.*?)<\/\1>/gi, // Regex to match heading tags
		(match: string, tagName: string, attributes: string, innerContent: string): string => {
			// Generate an ID based on the inner text of the heading
			const text = innerContent.replace(/<[^>]+>/g, ""); // Strip inner HTML tags
			const id = text
				.toLowerCase()
				.replace(/\s+/g, "-")
				.replace(/[^a-z0-9-]/g, ""); // Clean non-alphanumeric characters

			// Add the ID to the heading tag
			return `<${tagName}${attributes} id="${id}">${innerContent}</${tagName}>`;
		},
	);
};
