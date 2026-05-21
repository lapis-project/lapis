export const escapeCqlString = (input: string): string => {
	return input.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
};

export const escapeRegex = (input: string): string => {
	return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

export const formatTranscriptIds = (ids: Array<number>): Array<string> => {
	return ids.map((id) => `transcript_${String(id)}`);
};

/**
 * Builds the CQL structural filter for sca_doc.id.
 * Example: [1, 2] -> [sca_doc.id="transcript_1"|"transcript_2"]
 */
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

	// Helper to add condition based on mode
	const addCondition = (attr: string, value: string, useLc = false) => {
		if (!value) {
			return;
		}

		if (mode === "simple") {
			// Simple mode: Literal match
			// If useLc is true (for word), use the 'lc' attribute for case-insensitivity
			const targetAttr = useLc ? "lc" : attr;
			parts.push(`${targetAttr}="${escapeCqlString(value)}"`);
		} else {
			// Regex mode: Raw regex injection
			parts.push(`${attr}="${escapeCqlString(value)}"`);
		}
	};

	addCondition("word", criteria.word ?? "", true); // defaults to 'lc' in simple mode
	addCondition("lemma", criteria.lemma ?? "");
	addCondition("pos", criteria.pos ?? "");
	addCondition("feats", criteria.feats ?? "");

	if (parts.length === 0) {
		// Fallback if empty search to prevent crashing
		return '[word=".*"]';
	}

	if (criteria.transcripts && criteria.transcripts.length > 0) {
		// Combine all parts with AND (&)
		// add the transcript filter to the query
		return `[${parts.join(" & ")}] within ${buildDocIdCqlFilter(criteria.transcripts)}`;
	}

	// Combine all parts with AND (&)
	return `[${parts.join(" & ")}]`;
};
