export const searchRequest = async (query: string, from: string, path: string) => {
	const NOSKE_URL = process.env.NOSKE_INTERNAL_URL ?? "http://localhost:8080/bonito/run.cgi/";
	const CORPUS_NAME = process.env.NOSKE_CORPUS_NAME ?? "dioedbcorpus";
	const params = new URLSearchParams({
		corpname: CORPUS_NAME,
		q: `q${query}`,
		format: "json",
		viewmode: "kwic",
		from: from || "0",
	});
	const response = await fetch(`${NOSKE_URL}${path}?${params.toString()}`);
	return response;
};
