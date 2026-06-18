import { log } from "@acdh-oeaw/lib";

export const escapeCqlString = (input: string): string => {
	return input.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
};

export const escapeRegex = (input: string): string => {
	return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

export const formatTranscriptIds = (ids: Array<number>): Array<string> => {
	return ids.map((id) => `transcript_${String(id)}`);
};

export const buildDocIdCqlFilter = (ids: Array<number>): string => {
	const formatted = formatTranscriptIds(ids);
	if (formatted.length === 0) {
		return "";
	}
	if (formatted.length === 1) {
		return `<doc id="${formatted[0] ?? ""}"/>`;
	}
	return `<doc id="${formatted.map((id) => id).join("|")}"/>`;
};

interface CqlCriteria {
	word?: string;
	lemma?: string;
	pos?: string;
	feats?: string;
	transcripts?: Array<number>;
	projects?: Array<string>;
	settings?: Array<string>;
	age_lower?: number;
	age_upper?: number;
	locations?: Array<string>;
	first_languages?: Array<string>;
	dialect_competence?: number;
	gender?: string;
}
/*
 * When using the <doc> and <u> for the filters the within parameter needs to be chained in the following way
 * [feats=".*LautVor.*"] within (<u age="jung \(18\-35\) \+matura" /> within <doc ort_namelang=".*Allentsteig.*" />)
 * And use & or | to chain together the parameters for the query
 */
export const buildCql = (criteria: CqlCriteria, mode: "simple" | "regex"): string => {
	const parts_query: Array<string> = [];
	const parts_utterance: Array<string> = [];
	const parts_document: Array<string> = [];

	const addCondition = (
		arr: Array<string>,
		attr: string,
		value: string,
		useLc = false,
		operator = "=",
	) => {
		if (!value) {
			return;
		}

		if (mode === "simple") {
			const targetAttr = useLc ? "lc" : attr;
			arr.push(`${targetAttr}${operator}"${escapeCqlString(value)}"`);
		} else {
			arr.push(`${attr}${operator}"${escapeCqlString(value)}"`);
		}
	};

	addCondition(parts_query, "word", criteria.word ?? "", true);
	addCondition(parts_query, "lemma", criteria.lemma ?? "");
	addCondition(parts_query, "pos", criteria.pos ?? "");

	// -----------------------------------------------------------------
	// FEATS: split by whitespace, enforce distinct space-delimited match
	// -----------------------------------------------------------------
	if (criteria.feats) {
		const tags = criteria.feats.trim().split(/\s+/).filter(Boolean);

		for (const tag of tags) {
			// Escape regex metacharacters inside the tag itself
			//    (e.g. the literal '+' in "stdL+" or "sPal+")
			const escapedTag = escapeRegex(tag);

			// Build a pattern that anchors the tag as a whole feature.
			//    (^| )  → start of string OR a space
			//    ( |$)  → a space OR end of string
			// ie. Prevents that sPal is also matched to tags like sPal+
			const pattern = `.*(^| )${escapedTag}( |$).*`;

			// Escape backslashes
			addCondition(parts_query, "feats", escapeCqlString(pattern));
		}
	}

	// -----------------------------------------------------------------
	// Projects: Join the array of projects together and seperate by | (OR Operator)
	// -----------------------------------------------------------------
	if (criteria.projects) {
		const projects = criteria.projects.join("|");
		addCondition(parts_utterance, "subproject", escapeCqlString(projects));
	}

	// -----------------------------------------------------------------
	// settings: Join the array of interview settings together and seperate by | (OR Operator)
	// -----------------------------------------------------------------
	if (criteria.settings) {
		const settings = criteria.settings.join("|");
		addCondition(parts_document, "erhebungsart", escapeCqlString(settings));
	}

	// -----------------------------------------------------------------
	// age: Take the age range and pass it to the noske
	// -----------------------------------------------------------------
	if (criteria.age_lower) {
		addCondition(parts_utterance, "age_lower", String(criteria.age_lower), false, " >= ");
	}

	if (criteria.age_upper) {
		addCondition(parts_utterance, "age_lower", String(criteria.age_upper), false, " <= ");
	}

	if (criteria.locations) {
		for (const loc of criteria.locations) {
			const escpaedLoc = escapeRegex(loc);

			const pattern = `.*${escpaedLoc}.*`;

			// Escape backslashes
			addCondition(parts_utterance, "location", escapeCqlString(pattern));
		}
	}

	if (criteria.first_languages) {
		const languages = criteria.first_languages.join("|");
		// Currently not used in the NoSKE
		log.info(`first_language=${escapeCqlString(languages)}`);
		// addCondition(parts_utterance, "erhebungsart", escapeCqlString(languages))
	}

	if (criteria.dialect_competence) {
		addCondition(parts_utterance, "dialect_competence", String(criteria.dialect_competence));
	}

	if (criteria.gender) {
		addCondition(parts_utterance, "sex", escapeCqlString(criteria.gender));
	}

	if (parts_query.length === 0) {
		return '[word=".*"]';
	}

	if (criteria.transcripts && criteria.transcripts.length > 0) {
		const formatted = formatTranscriptIds(criteria.transcripts);
		if (formatted.length > 0) {
			addCondition(parts_document, "id", formatted.map((id) => id).join("|"));
		}
	}

	let queryCore = `[${parts_query.join(" & ")}]`;

	// Build query when only one part is set
	if (
		(parts_utterance.length > 0 && parts_document.length === 0) ||
		(parts_utterance.length === 0 && parts_document.length > 0)
	) {
		const allParts = parts_utterance.length > 0 ? parts_utterance : parts_document;
		// <doc id="${formatted.map((id) => id).join("|")}"/>
		queryCore += ` within <${parts_utterance.length > 0 ? "u" : "doc"} ${allParts.join(" & ")}/>`;
	} else if (parts_utterance.length > 0 && parts_document.length > 0) {
		queryCore += ` within (<u ${parts_utterance.join(" & ")}/> within <doc ${parts_document.join(" & ")}/>)`;
	}

	log.info(queryCore);
	return queryCore;
};
