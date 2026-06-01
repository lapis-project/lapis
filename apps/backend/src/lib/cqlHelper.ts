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
}

export const buildCql = (criteria: CqlCriteria, mode: "simple" | "regex"): string => {
	const parts: Array<string> = [];

	const addCondition = (attr: string, value: string, useLc = false) => {
		if (!value) {
			return;
		}

		if (mode === "simple") {
			const targetAttr = useLc ? "lc" : attr;
			parts.push(`${targetAttr}="${escapeCqlString(value)}"`);
		} else {
			parts.push(`${attr}="${escapeCqlString(value)}"`);
		}
	};

	addCondition("word", criteria.word ?? "", true);
	addCondition("lemma", criteria.lemma ?? "");
	addCondition("pos", criteria.pos ?? "");

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
			parts.push(`feats="${escapeCqlString(pattern)}"`);
		}
	}

	if (parts.length === 0) {
		return '[word=".*"]';
	}

	const queryCore = `[${parts.join(" & ")}]`;

	if (criteria.transcripts && criteria.transcripts.length > 0) {
		return `${queryCore} within ${buildDocIdCqlFilter(criteria.transcripts)}`;
	}

	return queryCore;
};
