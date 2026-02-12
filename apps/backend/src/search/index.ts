export const searchRequest = async (query: string) => {
	const NOSKE_URL = process.env.NOSKE_INTERNAL_URL ?? "http://localhost:8080";
	const CORPUS_NAME = process.env.NOSKE_CORPUS_NAME ?? "dioedb";
	const params = new URLSearchParams({
		corpname: CORPUS_NAME,
		q: `q${query}`,
		format: "json",
		action: "first",
	});
	const response = await fetch(`${NOSKE_URL}?${params.toString()}`);

	return response;
};
