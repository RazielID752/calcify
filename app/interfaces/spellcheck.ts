export type SpellcheckRulePayload = {
	wrongWord: string;
	correction: string;
};

export type SpellcheckRuleApiResponse = {
	id: string;
	wrongWord: string;
	correction: string;
	createdAt: string;
};