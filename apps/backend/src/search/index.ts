export const searchRequest = async (
	query: string,
	from: string,
	path: string,
	refs: string,
	pagesize: string,
) => {
	const NOSKE_URL = process.env.NOSKE_INTERNAL_URL ?? "http://localhost:8080/bonito/run.cgi/";
	const CORPUS_NAME = process.env.NOSKE_CORPUS_NAME ?? "dioedbcorpus";
	const params = new URLSearchParams({
		corpname: CORPUS_NAME,
		q: `q${query}`,
		format: "json",
		pagesize: pagesize || "50",
		viewmode: "kwic",
		fromp: from || "1",
		refs:
			refs ||
			"doc.id,doc.title,doc.erhebung,doc.erhebungsart,doc.name,file.id,u.who,u.sex,u.age,u.name,u.start,u.end,u.subproject,u.dialect_competence,u.standard_competence,u.location,u.lat,u.lon",
	});
	// eslint-disable-next-line n/no-unsupported-features/node-builtins
	const response = await fetch(`${NOSKE_URL}${path}?${params.toString()}`);
	return response;
};
