export function getNoskeAuthHeaders(): Record<string, string> | undefined {
	const username = process.env.NOSKE_USERNAME ?? "";
	const password = process.env.NOSKE_PASSWORD ?? "";

	if (!username && !password) {
		return undefined;
	}

	if (!username || !password) {
		throw new Error(
			"Incomplete NoSketch Engine credentials: both NOSKE_USERNAME and NOSKE_PASSWORD must be set",
		);
	}

	if (username.includes(":")) {
		throw new Error("Invalid NoSketch Engine username: ':' is not allowed in HTTP Basic auth");
	}

	const encodedCredentials = Buffer.from(`${username}:${password}`, "utf8").toString("base64");
	return {
		Authorization: `Basic ${encodedCredentials}`,
	};
}
