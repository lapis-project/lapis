export const nameShortener = (firstName: string, lastName: string): string => {
	return `${firstName.charAt(0)}. ${lastName}`;
};

export const truncateString = (input: string, maxLength: number): string => {
	if (input.length > maxLength) {
		return `${input.slice(0, maxLength)}...`;
	}
	return input;
};
