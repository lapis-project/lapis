export const escapeCqlString = (input: string): string => {
	return input.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
};

export const escapeRegex = (input: string): string => {
	return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

interface CqlCriteria {
	word?: string;
	lemma?: string;
	pos?: string;
	feats?: string;
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

	// Combine all parts with AND (&)
	return `[${parts.join(" & ")}]`;
};
