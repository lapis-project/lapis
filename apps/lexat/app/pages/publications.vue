<script lang="ts" setup>
const t = useTranslations();

usePageMetadata({
	title: t("PublicationsPage.title"),
});
</script>

<template>
	<MainContent class="container py-8">
		<div class="flex flex-col lg:flex-row gap-8">
			<article class="min-w-0 w-full lg:w-3/4">
				<section id="publications" class="scroll-mt-28 mb-10 pb-10 border-b border-muted">
					<div class="article-content break-words">
						<h1 class="text-2xl sm:text-3xl md:text-4xl font-semibold break-words">
							{{ t("PublicationsPage.title") }}
						</h1>
						<div class="my-4"><ShareButton :title="t('PublicationsPage.title')" /></div>
						<hr class="my-5 border-muted" />
						<i18n-t keypath="PublicationsPage.introduction" tag="p" scope="global">
							<template #articles>
								<NuxtLinkLocale to="/articles">{{ t("PublicationsPage.articles") }}</NuxtLinkLocale>
							</template>
						</i18n-t>
						<ul class="bibliography" role="list">
							<li>
								Korecky-Kröll, Katharina, Anja Wittibschlager, Theresa Ziegler &amp; Alexandra N.
								Lenz. [angenommen]. Lexical and Discourse-Pragmatic Variation in Dialect-Standard
								Repertoires in Austria. In Alexandra N. Lenz, Stephan Elspaß &amp; Stefan Newerkla
								(eds.), German in Austria. Variation – Contact – Perception. Berlin: Language
								Science Press.
							</li>
							<li>
								Lenz, Alexandra N. 2025. LexAT21 – Ein Lexikatlas und seine Hintergründe. In
								Alexandra N. Lenz (ed.). LexAT21: Atlas zur lexikalischen Variation in Österreich im
								21. Jahrhundert. [URL:
								<a
									href="https://lexat21.lapis-online.at/de/articles/lexat21-ein-lexikatlas-und-seine-hintergruende"
									>https://lexat21.lapis-online.at/de/articles/lexat21-ein-lexikatlas-und-seine-hintergruende</a
								>].
							</li>
							<li>
								Lenz, Alexandra N., Wolfgang Koppensteiner, Claudia Mattes &amp; Katharina
								Korecky-Kröll. 2026. Variationssensitive Ansätze zur korpuslinguistischen
								Erforschung lexikalischer Dynamik im 21. Jahrhundert. In Annelen Brunner, Gabriele
								Diewald, Sandra Hansen, Kristin Kopf &amp; Angelika Wöllstein (eds.), Deutsch im
								Wandel. Jahrbuch des Instituts für Deutsche Sprache 2025, 369–399. Berlin, Boston:
								De Gruyter.
								<a href="https://doi.org/10.1515/9783112240151-018"
									>https://doi.org/10.1515/9783112240151-018</a
								>
							</li>
							<li>
								Lenz, Alexandra N., Theresa Ziegler, Jan Höll, Markus Kunzmann &amp; Amelie Dorn.
								[im Druck]. Lexikalische Dynamik in österreichischen Varietäten aus panchronischer
								Perspektive. In Andrea Schamberger-Hirt [et al.] (eds.), 200 Jahre Dialektologie.
								Forschungsstand und Auftrag. Akten der 15. Bayerisch-Österreichischen
								Dialektologietagung 2023. (Jahrbuch der Schmellergesellschaft). Regensburg: Edition
								Vulpes.
							</li>
							<li>
								Pluschkovits, Markus, Daniel Schopper, Anja Wittibschlager, Jakob Bal, Kilian
								Kukelka, Olivia Reichl. 2026. A resource for lexical variation in a pluri-areal
								context: Introducing LexAT21, the atlas on lexical variation in Austria in the 21st
								century. In Cristina Grisot &amp; Thalassia Kontino (eds.), Selected papers from the
								CLARIN Annual Conference 2025 (Linköping Electronic Conference Proceedings 222).
								182–192.
								<a href="https://doi.org/10.3384/ecp222.1610">https://doi.org/10.3384/ecp222.1610</a
								>.
							</li>
							<li>
								Pluschkovits, Markus, Anja Wittibschlager &amp; Theresa Ziegler. [eingereicht].
								Lexikalische Variation in und um Österreichs städtische Ballungsräume. In IGDD
								Proceedings.
							</li>
							<li>
								Pluschkovits, Markus, Anja Wittibschlager, Daniel Schopper, Jakob Bal, Kilian
								Kukelka, Olivia Reichl, Marie Rohler &amp; Alexandra N. Lenz. [eingereicht]. LAPIS:
								ein Portal zu Sprachressourcen in Österreich. In Sammelband zur Methodenmesse der
								IDS-Jahrestagung. Mannheim: IDSopen.
							</li>
							<li>
								Stöckle, Philipp &amp; Markus Pluschkovits. 2026. The Structure of Lexical Variation
								in Austrian Varieties: A Quantitative Analysis. Languages, 11(8) 165.
								<a href="https://doi.org/10.3390/languages11080165"
									>https://doi.org/10.3390/languages11080165</a
								>.
							</li>
							<li>
								Stöckle, Philipp, Andreas Gellan, Markus Kunzmann, Alexandra N. Lenz &amp; Amelie
								Dorn. [angenommen]. Dialects in Austria: Lexical Variation and Change. In Alexandra
								N. Lenz, Stephan Elspaß &amp; Stefan Newerkla (eds.), German in Austria. Variation –
								Contact – Perception. Berlin: Language Science Press.
							</li>
							<li>
								Ziegler, Theresa, Wolfgang Koppensteiner, Andreas Gellan, Jakob Ebner &amp;
								Alexandra N. Lenz. [angenommen]. Standard Language in Austria: Lexical Variation. In
								Alexandra N. Lenz, Stephan Elspaß &amp; Stefan Newerkla (eds.), German in Austria.
								Variation – Contact – Perception. Berlin: Language Science Press.
							</li>
						</ul>
					</div>
				</section>
				<section id="pilot-publications" class="scroll-mt-28">
					<div class="article-content break-words">
						<h2 class="text-xl font-semibold">{{ t("PublicationsPage.pilot-title") }}</h2>
						<ul class="bibliography" role="list">
							<li>
								Lenz, Alexandra N., Amelie Dorn &amp; Theresa Ziegler. 2021. Lexik aus
								areal-horizontaler und vertikal-sozialer Perspektive. Erhebungsmethoden zur inter-
								und intraindividuellen Variation. <em>Sprachwissenschaft</em> 46/4, 387–433.
							</li>
							<li>
								Lenz, Alexandra N., Jan Höll &amp; Theresa Ziegler. 2023. Lexikalische Variation in
								Österreich – Ausgewählte Austriazismen im Stadt-Land-Vergleich.
								<em>Muttersprache</em>
								133 [Themenheft Stadtsprachenforschung], 82–115.
								<a href="https://doi.org/10.53371/60446">https://doi.org/10.53371/60446</a>.
							</li>
						</ul>
					</div>
				</section>
			</article>
			<aside class="order-first lg:order-last w-full lg:w-1/4">
				<nav
					:aria-label="t('PublicationsPage.navigator')"
					class="sticky top-20 border border-muted p-5"
				>
					<div class="flex items-center gap-2 font-semibold">
						<UIcon name="i-lucide-library-big" class="size-5 text-secondary" />
						{{ t("PublicationsPage.navigator") }}
					</div>
					<p class="mt-2 text-sm text-muted">{{ t("PublicationsPage.overview") }}</p>
					<div class="mt-5 flex flex-col gap-2">
						<a
							href="#publications"
							class="flex items-center gap-3 rounded-md border border-muted p-3 hover:bg-elevated focus-visible:outline-2 focus-visible:outline-secondary"
						>
							<UIcon name="i-lucide-book-open" class="size-5 shrink-0 text-secondary" />
							<span class="grow text-sm font-medium">{{ t("PublicationsPage.main-section") }}</span>
							<UBadge color="neutral" variant="subtle">10</UBadge>
						</a>
						<a
							href="#pilot-publications"
							class="flex items-center gap-3 rounded-md border border-muted p-3 hover:bg-elevated focus-visible:outline-2 focus-visible:outline-secondary"
						>
							<UIcon name="i-lucide-history" class="size-5 shrink-0 text-secondary" />
							<span class="grow text-sm font-medium">{{
								t("PublicationsPage.pilot-section")
							}}</span>
							<UBadge color="neutral" variant="subtle">2</UBadge>
						</a>
					</div>
					<hr class="my-5 border-muted" />
					<NuxtLinkLocale
						to="/articles/lexat21-einfuehrung"
						class="flex items-center gap-2 text-sm hover:underline"
					>
						<UIcon name="i-lucide-file-text" class="size-4 shrink-0" />
						{{ t("AppHeader.links.background") }}
					</NuxtLinkLocale>
				</nav>
			</aside>
		</div>
	</MainContent>
</template>

<style scoped>
.article-content .bibliography {
	margin-top: 2rem;
	padding: 0;
	list-style: none;
	font-style: italic;
	line-height: 1.75;
}

.bibliography li {
	margin-top: 1.5rem;
}

.bibliography li:first-child {
	margin-top: 0;
}
</style>
