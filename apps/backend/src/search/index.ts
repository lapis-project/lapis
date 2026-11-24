import { getNoskeAuthHeaders } from "@/search/auth.ts";

export const searchRequest = async (
	query: string,
	from: string,
	path: string,
	refs: string,
	pagesize: string,
	format: "json" | "xml" = "json",
	method: "GET" | "POST" = "GET",
) => {
	const NOSKE_URL = process.env.NOSKE_INTERNAL_URL ?? "http://localhost:8080/bonito/run.cgi/";
	const CORPUS_NAME = process.env.NOSKE_CORPUS_NAME ?? "dioedbcorpus";
	const headers = getNoskeAuthHeaders();
	const params = new URLSearchParams({
		corpname: CORPUS_NAME,
		q: `q${query}`,
		format,
		pagesize: pagesize || "50",
		viewmode: "kwic",
		...(format === "json" ? { attrs: "word,phon,token_id", attr_allpos: "kw" } : {}),
		fromp: from || "1",
		structs: "doc,doc.id",
		refs:
			refs ||
			"doc.id,doc.title,doc.erhebung,doc.erhebungsart,doc.name,file.id,u.who,u.sex,u.age,u.name,u.start,u.end,u.subproject,u.dialect_competence,u.standard_competence,u.location,u.lat,u.lon",
	});
	if (method === "POST") {
		return await fetch(`${NOSKE_URL}${path}`, {
			method,
			body: params,
			...(headers ? { headers } : {}),
		});
	}

	const url = `${NOSKE_URL}${path}?${params.toString()}`;
	return headers ? await fetch(url, { headers }) : await fetch(url);
};
