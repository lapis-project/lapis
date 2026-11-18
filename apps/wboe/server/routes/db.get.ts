export default defineEventHandler((event) => {
	const { search } = getRequestURL(event);
	return sendRedirect(event, `/de/db${search}`, 302);
});
