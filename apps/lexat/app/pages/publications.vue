<script lang="ts" setup>
const t = useTranslations();

usePageMetadata({
	title: t("PublicationsPage.title"),
});
</script>

<template>
	<MainContent class="container pt-8 pb-8 sm:pb-16">
		<div class="flex flex-col lg:flex-row gap-8">
			<article class="min-w-0 w-full lg:w-3/4">
				<div class="article-content break-words">
					<h1 class="text-2xl sm:text-3xl md:text-4xl font-semibold break-words">
						{{ t("PublicationsPage.title") }}
					</h1>
					<div class="my-4"><ShareButton :title="t('PublicationsPage.title')" /></div>
					<hr class="my-5 border-muted" />
					<i18n-t
						keypath="PublicationsPage.introduction"
						tag="p"
						scope="global"
						class="max-w-[90ch]"
					>
						<template #articles>
							<NuxtLinkLocale to="/articles">{{ t("PublicationsPage.articles") }}</NuxtLinkLocale>
						</template>
					</i18n-t>
				</div>
				<section id="in-preparation" class="article-content break-words scroll-mt-28 mt-10">
					<h2 class="text-xl font-semibold">{{ t("PublicationsPage.in-preparation") }}</h2>
					<ul
						class="mt-4 list-none p-0 font-[Georgia,'Times_New_Roman',serif] text-base not-italic leading-[1.8] [&>li]:mt-6 [&>li]:max-w-[75ch] [&>li]:pl-6 [&>li]:indent-[-1.5rem] [&>li:first-child]:mt-0"
						role="list"
					>
						<li>
							Korecky-Kröll, Katharina, Anja Wittibschlager, Theresa Ziegler &amp; Alexandra N.
							Lenz. [angenommen]. Lexical and Discourse-Pragmatic Variation in Dialect-Standard
							Repertoires in Austria. In Alexandra N. Lenz, Stephan Elspaß &amp; Stefan Newerkla
							(eds.), <em>German in Austria. Variation – Contact – Perception</em>. Berlin: Language
							Science Press.
						</li>
						<li>
							Pluschkovits, Markus, Anja Wittibschlager, Daniel Schopper, Jakob Bal, Kilian Kukelka,
							Olivia Reichl, Marie Rohler &amp; Alexandra N. Lenz. [eingereicht]. LAPIS: ein Portal
							zu Sprachressourcen in Österreich. In
							<em>Sammelband zur Methodenmesse der IDS-Jahrestagung</em>. Mannheim: IDSopen.
						</li>
						<li>
							Pluschkovits, Markus, Anja Wittibschlager &amp; Theresa Ziegler. [eingereicht].
							Lexikalische Variation in und um Österreichs städtische Ballungsräume. In IGDD
							Proceedings.
						</li>
						<li>
							Stöckle, Philipp, Andreas Gellan, Markus Kunzmann, Alexandra N. Lenz &amp; Amelie
							Dorn. [angenommen]. Dialects in Austria: Lexical Variation and Change. In Alexandra N.
							Lenz, Stephan Elspaß &amp; Stefan Newerkla (eds.),
							<em>German in Austria. Variation – Contact – Perception</em>. Berlin: Language Science
							Press.
						</li>
						<li>
							Ziegler, Theresa, Wolfgang Koppensteiner, Andreas Gellan, Jakob Ebner &amp; Alexandra
							N. Lenz. [angenommen]. Standard Language in Austria: Lexical Variation. In Alexandra
							N. Lenz, Stephan Elspaß &amp; Stefan Newerkla (eds.),
							<em>German in Austria. Variation – Contact – Perception</em>. Berlin: Language Science
							Press.
						</li>
					</ul>
				</section>
				<section id="publications-2026" class="article-content break-words scroll-mt-28 mt-10">
					<h2 class="text-xl font-semibold">2026</h2>
					<ul
						class="mt-4 list-none p-0 font-[Georgia,'Times_New_Roman',serif] text-base not-italic leading-[1.8] [&>li]:mt-6 [&>li]:max-w-[75ch] [&>li]:pl-6 [&>li]:indent-[-1.5rem] [&>li:first-child]:mt-0"
						role="list"
					>
						<li>
							Lenz, Alexandra N., Wolfgang Koppensteiner, Claudia Mattes &amp; Katharina
							Korecky-Kröll. 2026. Variationssensitive Ansätze zur korpuslinguistischen Erforschung
							lexikalischer Dynamik im 21. Jahrhundert. In Annelen Brunner, Gabriele Diewald, Sandra
							Hansen, Kristin Kopf &amp; Angelika Wöllstein (eds.),
							<em>Deutsch im Wandel. Jahrbuch des Instituts für Deutsche Sprache 2025</em>, 369–399.
							Berlin, Boston: De Gruyter.
							<a href="https://doi.org/10.1515/9783112240151-018"
								>https://doi.org/10.1515/9783112240151-018</a
							>.
						</li>
						<li>
							Lenz, Alexandra N., Theresa Ziegler, Jan Höll, Markus Kunzmann &amp; Amelie Dorn.
							2026. Lexikalische Dynamik in österreichischen Varietäten aus panchronischer
							Perspektive. In Andrea Schamberger-Hirt [et al.] (eds.),
							<em
								>200 Jahre Dialektologie. Forschungsstand und Auftrag. Akten der 15.
								Bayerisch-Österreichischen Dialektologietagung 2023</em
							>. (Jahrbuch der Schmellergesellschaft). Regensburg: Edition Vulpes, 171–200.
						</li>
						<li>
							Pluschkovits, Markus, Daniel Schopper, Anja Wittibschlager, Jakob Bal, Kilian Kukelka,
							Olivia Reichl. 2026. A resource for lexical variation in a pluri-areal context:
							Introducing LexAT21, the atlas on lexical variation in Austria in the 21st century. In
							Cristina Grisot &amp; Thalassia Kontino (eds.),
							<em>Selected papers from the CLARIN Annual Conference 2025</em> (Linköping Electronic
							Conference Proceedings 222). 182–192.
							<a href="https://doi.org/10.3384/ecp222.1610">https://doi.org/10.3384/ecp222.1610</a>.
						</li>
						<li>
							Stöckle, Philipp &amp; Markus Pluschkovits. 2026. The Structure of Lexical Variation
							in Austrian Varieties: A Quantitative Analysis. <em>Languages</em>, 11(8) 165.
							<a href="https://doi.org/10.3390/languages11080165"
								>https://doi.org/10.3390/languages11080165</a
							>.
						</li>
					</ul>
				</section>
				<section id="publications-2025" class="article-content break-words scroll-mt-28 mt-10">
					<h2 class="text-xl font-semibold">2025</h2>
					<ul
						class="mt-4 list-none p-0 font-[Georgia,'Times_New_Roman',serif] text-base not-italic leading-[1.8] [&>li]:mt-6 [&>li]:max-w-[75ch] [&>li]:pl-6 [&>li]:indent-[-1.5rem] [&>li:first-child]:mt-0"
						role="list"
					>
						<li>
							Lenz, Alexandra N. 2025. LexAT21 – Ein Lexikatlas und seine Hintergründe. In Alexandra
							N. Lenz (ed.).
							<em>LexAT21: Atlas zur lexikalischen Variation in Österreich im 21. Jahrhundert</em>.
							[URL:
							<a
								href="https://lexat21.lapis-online.at/de/articles/lexat21-ein-lexikatlas-und-seine-hintergruende"
								>https://lexat21.lapis-online.at/de/articles/lexat21-ein-lexikatlas-und-seine-hintergruende</a
							>].
						</li>
					</ul>
				</section>
				<section id="pilot-publications" class="scroll-mt-28 mt-10">
					<div class="article-content break-words">
						<h2 class="text-xl font-semibold">{{ t("PublicationsPage.pilot-title") }}</h2>
						<ul
							class="mt-4 list-none p-0 font-[Georgia,'Times_New_Roman',serif] text-base not-italic leading-[1.8] [&>li]:mt-6 [&>li]:max-w-[75ch] [&>li]:pl-6 [&>li]:indent-[-1.5rem] [&>li:first-child]:mt-0"
							role="list"
						>
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
							href="#in-preparation"
							class="flex items-center gap-3 rounded-md border border-muted p-3 hover:bg-elevated focus-visible:outline-2 focus-visible:outline-secondary"
						>
							<UIcon name="i-lucide-book-open" class="size-5 shrink-0 text-secondary" />
							<span class="grow text-sm font-medium">{{
								t("PublicationsPage.in-preparation")
							}}</span>
							<UBadge color="neutral" variant="subtle">5</UBadge>
						</a>
						<a
							href="#publications-2026"
							class="flex items-center gap-3 rounded-md border border-muted p-3 hover:bg-elevated focus-visible:outline-2 focus-visible:outline-secondary"
						>
							<UIcon name="i-lucide-book-open" class="size-5 shrink-0 text-secondary" />
							<span class="grow text-sm font-medium">2026</span>
							<UBadge color="neutral" variant="subtle">4</UBadge>
						</a>
						<a
							href="#publications-2025"
							class="flex items-center gap-3 rounded-md border border-muted p-3 hover:bg-elevated focus-visible:outline-2 focus-visible:outline-secondary"
						>
							<UIcon name="i-lucide-book-open" class="size-5 shrink-0 text-secondary" />
							<span class="grow text-sm font-medium">2025</span>
							<UBadge color="neutral" variant="subtle">1</UBadge>
						</a>
						<a
							href="#pilot-publications"
							class="flex items-center gap-3 rounded-md border border-muted p-3 hover:bg-elevated focus-visible:outline-2 focus-visible:outline-secondary"
						>
							<UIcon name="i-lucide-history" class="size-5 shrink-0 text-secondary" />
							<span class="grow text-sm font-medium">{{ t("PublicationsPage.pilot-title") }}</span>
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
