export const truncateText = (text: string, limit = 30) => {
	if (text.length <= limit) {
		return text;
	}
	return text.slice(0, limit) + "...";
};
