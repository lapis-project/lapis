export const argon2Config = {
	// Minimum parameters from docs
	timeCost: 2,
	memoryCost: 19456,
	outputLen: 32,
	parallelism: 1,
};

export const postStatusConst = ["Draft", "Published", "ReadyToPublish", "Unpublished"];

export const availableLangConst = ["de", "en"];

export const userRolesConst = ["admin", "editor", "superuser"];
