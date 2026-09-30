export default defineNuxtPlugin((nuxtApp) => {
	// Restore after hydration so server and client render the same initial UI.
	nuxtApp.hook("app:mounted", () => {
		void useDatasetStore().restore();
	});
});
