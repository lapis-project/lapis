type QueryNode = TokenNode | SequenceNode;

interface SequenceNode {
	type: "sequence";
	children: TokenNode[];
}

interface TokenNode {
	type: "token";
	quantifier?: {
		min: number;
		max: number;
	};
	conditions: ConditionNode[];
}

interface ConditionNode {
	field: "word" | "lemma" | "tag" | "pos";
	operator: "=" | "!=";
	value: string;
	connector?: "AND" | "OR";
	regex?: boolean;
}
