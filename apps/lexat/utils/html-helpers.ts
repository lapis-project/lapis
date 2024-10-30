export const addIdsToHeadings = (htmlContent: string): string => {
	const tempDiv = document.createElement("div");
	tempDiv.innerHTML = htmlContent;

	const headings = tempDiv.querySelectorAll<HTMLElement>("h1, h2, h3, h4, h5, h6");

	// process each heading to generate an ID and set it as an attribute
	headings.forEach((heading) => {
		// use the innerText of the heading to create the ID
		const text = heading.innerText || "";
		const id = text
			.toLowerCase()
			.replace(/\s+/g, "-")
			.replace(/[^a-z0-9-]/g, ""); // clean out any non-alphanumeric, non-hyphen chars

		// set the generated ID as an attribute on the heading element
		heading.id = id;
	});
	return tempDiv.innerHTML;
};
