/**
 * Uploaded datasets only exist in the browser, so they are read back once hydration finished —
 * restoring them earlier would make the client render something the server never sent.
 */
export default defineNuxtPlugin(() => {
	onNuxtReady(() => {
		useDatasetStore().restore();
	});
});
