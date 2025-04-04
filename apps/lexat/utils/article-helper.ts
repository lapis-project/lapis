export const formatAuthors = (
	authors: Array<{ firstname: string | null; lastname: string | null }>,
) => {
	const authorNames = authors.map((author) => `${author.firstname ?? ""} ${author.lastname ?? ""}`);
	if (!authorNames.length) {
		return "";
	}

	const authorsString = authorNames.join(", ");

	return authorsString;
};
