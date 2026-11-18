export interface DbSource {
	readonly [key: string]: unknown;
	readonly entry?: {
		readonly "@facs"?: unknown;
		readonly ref?: unknown;
	};
}

export interface DbHit {
	_id: string;
	_source: DbSource;
}

export type DbColumnKey =
	| "id"
	| "scan"
	| "lemma"
	| "nebenlemma"
	| "wortart"
	| "grammatik"
	| "fragenummer"
	| "frage"
	| "lautung"
	| "bedeutungLautung"
	| "ortLautung"
	| "kontext"
	| "bedeutungKontext"
	| "quelle"
	| "bibliographie"
	| "sigle"
	| "staat"
	| "land"
	| "grossregion"
	| "kleinregion"
	| "gemeinde";

export interface WboeTableRow extends Record<DbColumnKey, string> {
	sigles: string[];
}

export interface DbColumn {
	key: DbColumnKey;
	label: string;
	searchField?: string;
	sortField?: string;
	extended?: boolean;
}

export const dbColumns: ReadonlyArray<DbColumn> = [
	{ key: "scan", label: "Scan" },
	{
		key: "id",
		label: "ID",
		searchField: "ID",
		sortField: "ID",
		extended: true,
	},
	{
		key: "lemma",
		label: "Lemma",
		searchField: "HL",
		sortField: "HL",
	},
	{
		key: "nebenlemma",
		label: "Nebenlemma",
		searchField: "NL",
		sortField: "NL",
		extended: true,
	},
	{
		key: "wortart",
		label: "Wortart",
		searchField: "POS",
		sortField: "POS",
	},
	{
		key: "grammatik",
		label: "Grammatik",
		searchField: "GRAM/LT1",
		sortField: "GRAM/LT1",
		extended: true,
	},
	{
		key: "fragenummer",
		label: "Fragenummer",
		searchField: "NR",
		sortField: "NR",
		extended: true,
	},
	{ key: "frage", label: "Frage", extended: true },
	{
		key: "lautung",
		label: "Lautung",
		searchField: "LT1_teuthonista",
		sortField: "LT1_teuthonista",
	},
	{
		key: "bedeutungLautung",
		label: "Bedeutung/Lautung",
		searchField: "BD/LT*",
		sortField: "BD/LT*",
	},
	{
		key: "ortLautung",
		label: "Ort/Lautung",
		searchField: "Ort/LT",
		extended: true,
	},
	{
		key: "kontext",
		label: "Kontext",
		searchField: "KT1",
		sortField: "KT1",
	},
	{
		key: "bedeutungKontext",
		label: "Bedeutung/Kontext",
		searchField: "BD/KT*",
		sortField: "BD/KT*",
	},
	{
		key: "quelle",
		label: "Quelle",
		searchField: "QU",
		sortField: "QU",
		extended: true,
	},
	{
		key: "bibliographie",
		label: "Bibliographische Angabe",
		searchField: "BIBL",
		sortField: "BIBL",
		extended: true,
	},
	{
		key: "sigle",
		label: "Sigle",
		searchField: "Sigle1",
		sortField: "Sigle1",
	},
	{ key: "staat", label: "Staat", sortField: "Sigle10" },
	{
		key: "land",
		label: "Land",
		searchField: "Bundesland1",
		sortField: "Bundesland1",
	},
	{
		key: "grossregion",
		label: "Großregion",
		searchField: "Großregion1",
		sortField: "Großregion1",
	},
	{
		key: "kleinregion",
		label: "Kleinregion",
		searchField: "Kleinregion1",
		sortField: "Kleinregion1",
	},
	{
		key: "gemeinde",
		label: "Gemeinde",
		searchField: "Gemeinde1",
		sortField: "Gemeinde1",
	},
];

export function isWboeTableRow(value: unknown): value is WboeTableRow {
	if (value === null || typeof value !== "object") return false;
	const row = value as Record<string, unknown>;
	return (
		typeof row.id === "string" &&
		row.id.length > 0 &&
		Array.isArray(row.sigles) &&
		row.sigles.every((sigle: unknown) => typeof sigle === "string") &&
		dbColumns.every(({ key }) => typeof row[key] === "string")
	);
}

const grammarFields = /* @__PURE__ */ Array.from(
	{ length: 9 },
	(_, index) => `GRAM/LT${index + 1}`,
);
const contextFields = /* @__PURE__ */ Array.from({ length: 8 }, (_, index) => `KT${index + 1}`);
const pronunciationFields = /* @__PURE__ */ Array.from({ length: 9 }, (_, index) => {
	const stem = `LT${index + 1}`;
	return [`${stem}_teuthonista`, `${stem}_theutonista`] as const;
});

const citationPattern = /›\s*(?:BD\/)?(?:LT|KT)\d*\b|\s+(?:LT|KT)\d+$/gu;
const placeCodePattern = /^\d+[A-Z]?(?:\.\d+[a-z]?\d*)?\s+/u;

const countryCodes = [
	[/^1$/u, "AT/IT"],
	[/^(?:0\.[123]|0\.5b|1A(?:\.|$)|11\.9|01\.)/u, "IT"],
	[/^(?:0\.4|8\.6|11\.7)/u, "SI"],
	[/^0\.5a/u, "CH"],
	[/^(?:1[BC]|[2-7]|Gasteinert\.:Salzachpong\.:Sa\.|Gr\.Arlt\.:Salzachpong\.:Sa\.|Öst\.)/u, "AT"],
	[/^(?:8\.[123]|9\.|10\.|11\.1)/u, "CZ"],
	[/^8\.4/u, "SK"],
	[/^(?:8\.5|11\.2|wb0:11\.2)/iu, "HU"],
	[/^11\.3/u, "RO"],
	[/^11\.5/u, "HR"],
	[/^wb0(?::(?:B|D)|D-Bay)/iu, "DE"],
	[/^wb0:Ö-V/iu, "AT"],
	[/^wb0:SL/iu, "SI"],
	[/^wb0:YU/iu, "RS"],
	[/^wb0:RU/iu, "RO"],
	[/^wb0:CZ\+D$/iu, "CZ/DE"],
] as const;

function strings(value: unknown): string[] {
	if (Array.isArray(value)) return value.flatMap(strings);
	if (typeof value === "string" || typeof value === "number") {
		const text = String(value).trim();
		return text ? [text] : [];
	}
	return [];
}

function firstText(value: unknown): string {
	const values = strings(value);
	return values.find((text) => !text.startsWith("≈")) ?? values[0]?.replace(/^≈\s*/u, "") ?? "";
}

function joined(values: ReadonlyArray<string>): string {
	return [...new Set(values.filter(Boolean))].join(", ");
}

function cleanText(value: string): string {
	return value.replace(/\s+/gu, " ").trim();
}

function withoutCitations(value: string): string {
	return cleanText(value.replace(citationPattern, ""));
}

function questionParts(value: unknown): { number: string; text: string } {
	const values = strings(value).filter((text) => !text.startsWith("≈"));
	const questions = (values.length > 0 ? values : [firstText(value)]).map((question) => {
		const separator = question.indexOf(":");
		return separator === -1
			? { number: question, text: "" }
			: { number: question.slice(0, separator).trim(), text: question.slice(separator + 1).trim() };
	});
	return {
		number: joined(questions.map((question) => question.number)),
		text: joined(questions.map((question) => question.text)),
	};
}

function siglesInBraces(value: unknown): string[] {
	return strings(value).flatMap((text) => text.match(/\{([^}]+)\}/u)?.[1] ?? []);
}

function referenceSigles(source: DbSource): string[] {
	const refs = source.entry?.ref;
	for (const ref of Array.isArray(refs) ? refs : [refs]) {
		if (
			ref &&
			typeof ref === "object" &&
			"@type" in ref &&
			ref["@type"] === "quelleBearbeitet" &&
			"$" in ref
		) {
			const sigles = siglesInBraces(ref.$);
			if (sigles.length > 0) return sigles;
		}
	}
	return siglesInBraces(source.QDB);
}

function splitSigles(values: ReadonlyArray<string>): string[] {
	return values
		.flatMap((value) => value.split(","))
		.map((value) => {
			return withoutCitations(value).replace(/^[\s{⚠]+|[\s}]+$/gu, "");
		})
		.filter(Boolean);
}

function countryCode(sigle: string): string {
	for (const [pattern, country] of countryCodes) {
		if (pattern.test(sigle)) return country;
	}
	if (/^wb0\??$/iu.test(sigle)) return "n/a";
	return /^wb0:([A-Z]{2})(?:[-+]|$)/iu.exec(sigle)?.[1]?.toUpperCase() ?? "";
}

function placeNames(value: unknown, names: ReadonlyMap<string, string>): string {
	return joined(
		strings(value).map((place) => {
			const label = withoutCitations(place).replace(placeCodePattern, "");
			return names.get(label) ?? label;
		}),
	);
}

export function formatDbRecord({ _id, _source: source }: DbHit): WboeTableRow {
	const indexedSigles = splitSigles(strings(source.Sigle1));
	const sigles = [
		...new Set(indexedSigles.length > 0 ? indexedSigles : splitSigles(referenceSigles(source))),
	];
	const question = questionParts(source.NR);

	return {
		id: _id,
		scan: firstText(source.entry?.["@facs"]),
		sigles,
		lemma: firstText(source.HL),
		nebenlemma: firstText(source.NL),
		wortart: joined(strings(source.POS)),
		grammatik: joined(grammarFields.map((field) => firstText(source[field]))),
		fragenummer: question.number,
		frage: question.text,
		lautung: joined(
			pronunciationFields.map(
				([field, historicalField]) =>
					firstText(source[field]) || firstText(source[historicalField]),
			),
		),
		bedeutungLautung: withoutCitations(firstText(source["BD/LT*"])),
		ortLautung: joined(strings(source["Ort/LT"]).map(withoutCitations)),
		kontext: joined(contextFields.map((field) => cleanText(firstText(source[field])))),
		bedeutungKontext: joined(strings(source["BD/KT*"]).map(withoutCitations)),
		quelle: joined(strings(source.QU)),
		bibliographie: joined(strings(source.BIBL)),
		sigle: joined(sigles),
		staat: joined(sigles.map(countryCode)),
		land: placeNames(source.Bundesland1, federalStates),
		grossregion: placeNames(source.Großregion1, majorRegions),
		kleinregion: placeNames(source.Kleinregion1, minorRegions),
		gemeinde: joined(
			strings(source.Gemeinde1).map((place) =>
				withoutCitations(place).replace(placeCodePattern, ""),
			),
		),
	};
}

// Display names for the geographic abbreviations in the database.
const federalStates = /* @__PURE__ */ new Map([
	["STir.", "Südtirol"],
	["OTir.", "Osttirol"],
	["NTir.", "Nordtirol"],
	["Ktn.", "Kärnten"],
	["Stmk.", "Steiermark"],
	["Sbg.", "Salzburg"],
	["OÖ", "Oberösterreich"],
	["NÖ", "Niederösterreich"],
	["Bgl.", "Burgenland"],
]);

const majorRegions = /* @__PURE__ */ new Map([
	["MBgl.", "Mittelburgenland"],
	["NBgl.", "Nordburgenland"],
	["SBgl.", "Südburgenland"],
	["MKtn.", "Mittelkärnten"],
	["ObKtn.", "Oberkärnten"],
	["UKtn.", "Unterkärnten"],
	["Industriev.", "Industrieviertel"],
	["Mostv.", "Mostviertel"],
	["Waldv.", "Waldviertel"],
	["Weinv.", "Weinviertel"],
	["mNTir.", "mittleres Nordtirol"],
	["öNTir.", "östliches Nordtirol"],
	["wNTir.", "westliches Nordtirol"],
	["Hausrv.", "Hausruckviertel"],
	["Innv.", "Innviertel"],
	["Mühlv.", "Mühlviertel"],
	["Traunv.", "Traunviertel"],
	["OTir.", "Osttirol"],
	["Flachg.", "Flachgau"],
	["Lung.", "Lungau"],
	["Pinzg.", "Pinzgau"],
	["Pong.", "Pongau"],
	["Tenneng.", "Tennengau"],
	["mSTir.", "mittleres Südtirol"],
	["öSTir.", "östliches Südtirol"],
	["wSTir.", "westliches Südtirol"],
	["mbair.ObStmk.", "mittelbairisch beeinflusste Obersteiermark"],
	["MStmk.", "Mittelsteiermark"],
	["OStmk.", "Oststeiermark"],
	["sbair.ObStmk.", "südbairische Obersteiermark"],
	["WStmk.", "Weststeiermark"],
]);

const minorRegions = /* @__PURE__ */ new Map([
	["nMBgl.", "nördliches Mittelburgenland"],
	["sMBgl.", "südliches Mittelburgenland"],
	["bgl.Heide", "burgenländische Heide"],
	["Eisenst.", "Eisenstadt"],
	["nSeew.", "nördlicher Seewinkel"],
	["nwNBgl.", "nordwestliches Nordburgenland"],
	["sSeew.", "südlicher Seewinkel"],
	["swNBgl.", "südwestliches Nordburgenland"],
	["Bernstn.Hügelld.", "Bernsteiner Hügelland"],
	["bgl.Raabt.", "burgenländisches Raabtal"],
	["Güssing.Hügelld.", "Güssinger Hügelland"],
	["mittl.bgl.Lafnitzt.", "mittleres burgenländisches Lafnitztal"],
	["Neuhs.Hügelld.", "Neuhauser Hügelland"],
	["nOberwart.Hügelld.", "nördliches Oberwarter Hügelland"],
	["ob.bgl.Lafnitzt.", "oberes burgenländisches Lafnitztal"],
	["ob.bgl.Pinkat.", "oberes burgenländisches Pinkatal"],
	["Rechnitz.Hügelld.", "Rechnitzer Hügelland"],
	["sOberwart.Hügelld.", "südliches Oberwarter Hügelland"],
	["Strembacht.", "Strembachtal"],
	["unt.bgl.Lafnitzt.", "unteres burgenländisches Lafnitztal"],
	["unt.bgl.Pinkat.", "unteres burgenländisches Pinkatal"],
	["Gegendt.", "Gegendtal"],
	["Glant.", "Glantal"],
	["Katscht.", "Katschtal"],
	["Krappfd.", "Krappfeld"],
	["Liesert.", "Liesertal"],
	["Lurnfd.", "Lurnfeld"],
	["Maltat.", "Maltatal"],
	["Metnitzt.", "Metnitztal"],
	["Millst.Geg.", "Millstätter Gegend"],
	["Nockgeb.", "Nockgebiet"],
	["nWörthers.Geb.", "nördliches Wörtherseegebiet"],
	["obGurkt.", "oberes Gurktal"],
	["obstGurkt.", "oberstes Gurktal"],
	["Ossiach.Geg.", "Ossiacher Gegend"],
	["öWörthers.Geb.", "östliches Wörtherseegebiet"],
	["Rosent.", "Rosental"],
	["sWörthers.Geb.", "südliches Wörtherseegebiet"],
	["UDraut.", "Unterdrautal"],
	["uGailt.", "unteres Gailtal"],
	["uGurkt.", "unteres Gurktal"],
	["Wimitzgeb.", "Wimitzgebiet"],
	["wWörthers.Geb.", "westliches Wörtherseegebiet"],
	["Zollfd.", "Zollfeld"],
	["Gitscht.", "Gitschtal"],
	["mMöllt.", "mittleres Mölltal"],
	["ob.Ktn.Lesacht.", "oberes Kärntner Lesachtal"],
	["ObDraut.", "Oberdrautal"],
	["obGailt.", "oberes Gailtal"],
	["obMöllt.", "oberes Mölltal"],
	["uMöllt.", "unteres Mölltal"],
	["unt.Ktn.Lesacht.", "unteres Kärntner Lesachtal"],
	["Weißens.Geb.", "Weißenseegebiet"],
	["mLavantt.", "mittleres Lavanttal"],
	["nJaungeb.", "nördliches Jaungebiet"],
	["obGörtschitzt.", "oberes Görtschitztal"],
	["obLavantt.", "oberes Lavanttal"],
	["sJaungeb.", "südliches Jaungebiet"],
	["uGörtschitzt.", "unteres Görtschitztal"],
	["uLavantt.", "unteres Lavanttal"],
	["Buckl.Wt.", "Bucklige Welt"],
	["nö.Semmeringgeb.", "niederösterreichisches Semmeringgebiet"],
	["nWr.Beck.", "nördliches Wiener Becken"],
	["nWr.Wd.", "nördlicher Wiener Wald"],
	["Piestinggeb.", "Piestinggebiet"],
	["Raxgeb.", "Raxgebiet"],
	["Schneebg.Geb.", "Schneeberggebiet"],
	["sWr.Beck.", "südliches Wiener Becken"],
	["sWr.Wd", "südlicher Wiener Wald"],
	["Triestingt.", "Triestingtal"],
	["Dunkelstn.Wd.", "Dunkelsteiner Wald"],
	["Melkt.", "Melktal"],
	["nö.Ennst.", "niederösterreichisches Ennstal"],
	["nö.Strudeng.", "niederösterreichischer Strudengau"],
	["obErlauft.", "oberes Erlauftal"],
	["obPielacht.", "oberes Pielachtal"],
	["obTraisent.", "oberes Traisental"],
	["obYbbst.", "oberes Ybbstal"],
	["Perschlingt.", "Perschlingtal"],
	["sNibelungeng.", "südlicher Nibelungengau"],
	["Strengbg.Hügelld.", "Strengberger Hügelland"],
	["sTulln.Beck.", "südliches Tullner Becken"],
	["sWachau", "südliche Wachau"],
	["Tullnt.", "Tal der Großen Tulln und Tal der Kleinen Tulln"],
	["uErlauft.", "unteres Erlauftal"],
	["uPielacht.", "unteres Pielachtal"],
	["uTraisent.", "unteres Traisental"],
	["uYbbst.", "unteres Ybbstal"],
	["wUmg.Ötscher", "westliche Umgebung des Ötscher"],
	["Gföhl.Wd.", "Gföhler Wald"],
	["Horn.Becken", "Horner Becken"],
	["Lainsitzgeb.", "Lainsitzgebiet"],
	["mKampt.", "mittleres Kamptal"],
	["nNibelungeng.", "nördlicher Nibelungengau"],
	["nö.Kremsgeb.", "niederösterreichisches Kremsgebiet"],
	["nöWaldv.", "nordöstliches Waldviertel"],
	["nUmg.Krems", "nördliche Umgebung von Krems"],
	["nUmg.Zwettl", "nördliche Umgebung von Zwettl"],
	["nWachau", "nördliche Wachau"],
	["nwWaldv.", "nordwestliches Waldviertel"],
	["obKampt.", "oberes Kamptal"],
	["obstKampt.", "oberstes Kamptal"],
	["sUmg.Zwettl", "südliche Umgebung von Zwettl"],
	["uKampt.", "unteres Kamptal"],
	["Umg.Allentsteig", "Allentsteig mit Umgebung"],
	["Weiten.Hochld.", "Weitener Hochland"],
	["wUmg.Zwettl", "westliche Umgebung von Zwettl"],
	["Yspert.", "Yspertal"],
	["nöMarchfd.", "nordöstliches Marchfeld"],
	["nöWeinv.", "nordöstliches Weinviertel"],
	["nTulln.Beck.", "nördliches Tullner Becken"],
	["nUmg.Tulln.Beck.", "nördliche Umgebung des Tullner Beckens"],
	["nwMarchfd.", "nordwestliches Marchfeld"],
	["östl.mMarchfd.", "östliches mittleres Marchfeld"],
	["östl.mWeinv.", "östliches mittleres Weinviertel"],
	["Pulkaut.", "Pulkautal"],
	["söMarchfd.", "südöstliches Marchfeld"],
	["söUmg.Pulkaut.", "südöstliche Umgebung des Pulkautales"],
	["swMarchfd.", "südwestliches Marchfeld"],
	["Umg.Korneubg.", "Korneuburg mit Umgebung"],
	["Umg.Retz", "Retz mit Umgebung"],
	["west.mMarchfd.", "westliches mittleres Marchfeld"],
	["westl.mWeinv.", "westliches mittleres Weinviertel"],
	["Gschnitzt.", "Gschnitztal"],
	["mInnt.", "mittleres Inntal"],
	["mittl.NTir.Wippt.", "mittleres Nordtiroler Wipptal"],
	["ob.NTir.Wippt.", "oberes Nordtiroler Wipptal"],
	["obStub.", "oberes Stubai"],
	["obstZillert.", "oberstes Zillertal"],
	["obZillert.", "oberes Zillertal"],
	["Schmirnt.", "Schmirntal"],
	["unt.NTir.Wippt.", "unteres Nordtiroler Wipptal"],
	["uStub.", "unteres Stubai"],
	["uZillert.", "unteres Zillertal"],
	["Valst.", "Valstal"],
	["Achens.Beck.", "Achenseebecken"],
	["Brixent.", "Brixental"],
	["Jochbergt.", "Jochbergtal"],
	["Kössent.", "Kössental"],
	["Leukent.", "Leukental"],
	["nUInngeb.", "nördliches Unterinngebiet"],
	["öUInnt.", "östliches Unterinntal"],
	["Pillers.Geb.", "Pillerseegebiet"],
	["Söllt.", "Sölltal"],
	["sUInngeb.", "südliches Unterinngebiet"],
	["wUInnt.", "westliches Unterinntal"],
	["Außf.Lecht.", "Außerferner Lechtal"],
	["Gurglt.", "Gurgltal"],
	["Kaunert.", "Kauner Tal"],
	["Mieming.Plateau", "Mieminger Plateau"],
	["nwAußf.", "nordwestliches Außerfern"],
	["obLecht.", "oberes Lechtal"],
	["obÖtzt.", "oberes Ötztal"],
	["obPazn.", "oberes Paznaun"],
	["obPitzt.", "oberes Pitztal"],
	["obStanzert.", "oberes Stanzer Tal"],
	["obstObInnt.", "oberstes Oberinntal"],
	["obstÖtzt.", "oberstes Ötztal"],
	["öObInnt.", "östliches Oberinntal"],
	["Sannat.", "Sannatal"],
	["Seefd.Plateau", "Seefelder Plateau"],
	["Sell.", "Sellrain"],
	["Tannheimert.", "Tannheimer Tal"],
	["uLecht.", "unteres Lechtal"],
	["uÖtzt.", "unteres Ötztal"],
	["uPazn.", "unteres Paznaun"],
	["uPitzt.", "unteres Pitztal"],
	["uStanzert.", "unteres Stanzer Tal"],
	["wObInnt.", "westliches Oberinntal"],
	["Zw.Toren", "Zwischentoren"],
	["mHausrv.", "mittleres Hausruckviertel"],
	["nHausrv.", "nördliches Hausruckviertel"],
	["Umg.Vöcklamt.", "Vöcklamarkt mit Umgebung"],
	["wSkgt.", "westliches Salzkammergut"],
	["nördl.obInnv.", "nördliches oberes Innviertel"],
	["östl.mInnv.", "östliches mittleres Innviertel"],
	["östl.uInnv.", "östliches unteres Innviertel"],
	["südl.obInnv.", "südliches oberes Innviertel"],
	["west.mInnv.", "westliches mittleres Innviertel"],
	["westl.uInnv.", "westliches unteres Innviertel"],
	["Machld.", "Machland"],
	["Naarnhügelld.", "Naarnhügelland"],
	["nöstl.obMühlv.", "nordöstliches oberes Mühlviertel"],
	["nöstl.uMühlv.", "nördliches unteres Mühlviertel"],
	["nwestl.obMühlv.", "nordwestliches oberes Mühlviertel"],
	["nwestl.uMühlv.", "nordwestliches unteres Mühlviertel"],
	["oö.Strudeng.", "oberösterreichischer Strudengau"],
	["söstl.obMühlv.", "südöstliches oberes Mühlviertel"],
	["swestl.obMühlv.", "südwestliches oberes Mühlviertel"],
	["swestl.uMühlv.", "südwestliches unteres Mühlviertel"],
	["nördl.oö.Ennst.", "nördliches oberösterreichisches Ennstal"],
	["nöSkgt.", "nordöstliches Salzkammergut"],
	["nUmg.Laakn.", "nördliche Umgebung von Laakirchen"],
	["ob.oö.Kremst.", "oberes oberösterreichisches Kremstal"],
	["obAlmt.", "oberes Almtal"],
	["obSteyrt.", "oberes Steyrtal"],
	["söSkgt.", "südöstliches Salzkammergut"],
	["söstl.Umg.Wels", "südöstliche Umgebung von Wels"],
	["südl.oö.Ennst.", "südliches oberösterreichisches Ennstal"],
	["sUmg.Linz", "südliche Umgebung von Linz"],
	["swestl.Umg.Wels", "südwestliche Umgebung vonWels"],
	["uAlmt.", "unteres Almtal"],
	["unt.oö.Kremst.", "unteres oberösterreichisches Kremstal"],
	["uSteyrt.", "unteres Steyrtal"],
	["Def.", "Defereggen"],
	["Kalsert.", "Kalser Tal"],
	["Lienz.Beck.", "Lienzer Becken"],
	["obIselt.", "oberes Iseltal"],
	["östl.OTir.Pustert.", "östliches Osttiroler Pustertal"],
	["OTir.Lesacht.", "Osttiroler Lesachtal"],
	["uIselt.", "unteres Iseltal"],
	["Villgratent.", "Villgratental"],
	["Virgent.", "Virgental"],
	["westl.OTir.Pustert.", "westliches Osttiroler Pustertal"],
	["nöFlachg.", "nordöstlicher Flachgau"],
	["nwFlachg.", "nordwestlicher Flachgau"],
	["Salzbg.", "Salzburg"],
	["söFlachg.", "südöstlicher Flachgau"],
	["swFlachg.", "südwestlicher Flachgau"],
	["nObLung.", "nördlicher Oberlungau"],
	["söObLung.", "südöstlicher Oberlungau"],
	["swObLung.", "südwestlicher Oberlungau"],
	["ULung.", "Unterlungau"],
	["Fuschert.", "Fuschertal"],
	["Glemmt.", "Glemmtal"],
	["MPinzg.Hochköniggeb.", "Mitterpinzgauer Hochköniggebiet"],
	["obSalzacht.", "oberes Salzachtal"],
	["obstSalzacht.", "oberstes Salzachtal"],
	["Raurisert.", "Rauriser Tal"],
	["Saalacht.", "Saalachtal"],
	["Saalfd.Beck.", "Saalfeldener Becken"],
	["UPinzg.Hochköniggeb.", "Unterpinzgauer Hochköniggebiet"],
	["Zellers.Geg.", "Zellerseegegend"],
	["Ennspong.", "Ennspongau"],
	["Fritzt.", "Fritztal"],
	["Gasteinert.", "Gasteinertal"],
	["Gr.Arlt.", "Großarltal"],
	["Kl.Arlt.", "Kleinarltal"],
	["mSalzacht.", "mittleres Salzachtal"],
	["obLammert.", "oberes Lammertal"],
	["Pong.Hochköniggeb.", "Pongauer Hochköniggebiet"],
	["mLammert.", "mittleres Lammertal"],
	["uLammert.", "unteres Lammertal"],
	["Umg.Adnet", "Adnet mit Umgebung"],
	["uSalzacht.", "unteres Salzachtal"],
	["Jaufengeb.", "Jaufengebiet"],
	["mEisackt.", "mittleres Eisacktal"],
	["nwBoz.Uld.", "nordwestliches Bozner Unterland"],
	["obEisackt.", "oberes Eisacktal"],
	["obSarnt.", "oberes Sarntal"],
	["Pfitscht.", "Pfitschtal"],
	["Reggelbg.", "Reggelberg"],
	["sBoz.Uld.", "südliches Bozner Unterland"],
	["Schlerngeb.", "Schlerngebiet"],
	["STir.Wippt.", "Südtiroler Wipptal"],
	["uEisackt.", "unteres Eisacktal"],
	["uSarnt.", "unteres Sarntal"],
	["Villn.", "Villnöss"],
	["Antholzert.", "Antholzer Tal"],
	["Gsiesert.", "Gsieser Tal"],
	["Lüsenert.", "Lüsener Tal"],
	["ob.STir.Pustert.", "oberes Südtiroler Pustertal"],
	["obAhrnt.", "oberes Ahrntal"],
	["Pragsert.", "Pragser Tal"],
	["Tauferert.", "Tauferer Tal"],
	["uAhrnt.", "unteres Ahrntal"],
	["unt.STir.Pustert.", "unteres Südtiroler Pustertal"],
	["Dt.Geg.", "Deutschgegend"],
	["Martellt.", "Martelltal"],
	["Münstert.", "Münstertal"],
	["nördl.obVinschg.", "Deutschgegend"],
	["obUltent.", "oberes Ultental"],
	["öEtschgeb.", "östliches Etschgebiet"],
	["östl.uVinschg.", "östlicher unterer Vinschgau"],
	["Pass.", "Passeier"],
	["Schnalst.", "Schnalstal"],
	["südl.obVinschg.", "südlicher oberer Vinschgau"],
	["Umg.Meran", "Meran mit Umgebung"],
	["uUltent.", "unteres Ultental"],
	["westl.uVinschg.", "westlicher unterer Vinschgau"],
	["wEtschgeb.", "westliches Etschgebiet"],
	["Auss.Ld.", "Ausseer Land"],
	["Donnersbacht.", "Donnersbachtal"],
	["Erzbg.Geg.", "Erzberggegend"],
	["Lamingt.", "Lamingtal"],
	["Liesingt.", "Liesingtal"],
	["mittl.steir.Ennst.", "mittleres steirisches Ennstal"],
	["ob.steir.Ennst.", "oberes steirisches Ennstal"],
	["obMürzt.", "oberes Mürztal"],
	["obSalzat.", "oberes Salzatal"],
	["östl.obMurt.", "östliches oberes Murtal"],
	["Paltent.", "Paltental"],
	["Sölkt.", "Sölktal"],
	["steir.Eisenstr.", "steirische Eisenstraße"],
	["steir.Semmeringgeb.", "steirisches Semmeringgebiet"],
	["Thörlt.", "Thörltal"],
	["uMürzt.", "unteres Mürztal"],
	["unt.steir.Ennst.", "unteres steirisches Ennstal"],
	["uSalzat.", "unteres Salzatal"],
	["mMStmk.", "mittlere Mittelsteiermark"],
	["nMStmk.", "nördliche Mittelsteiermark"],
	["sMStmk.", "südliche Mittelsteiermark"],
	["mittl.steir.Raabt.", "mittleres steirisches Raabtal"],
	["nördl.steir.Lafnitzt.", "nördliches steirisches Lafnitztal"],
	["ob.steir.Raabt.", "oberes steirisches Raabtal"],
	["obFeistritzt.", "oberes Feistritztal"],
	["obstFeistritzt.", "oberstes Feistritztal"],
	["osteir.Grabenld.", "oststeirisches Grabenland"],
	["Rittscheint.", "Rittscheintal"],
	["steir.Pinkat.", "steirisches Pinkatal"],
	["südl.steir.Lafnitzt.", "südliches steirisches Lafnitztal"],
	["uFeistritzt.", "unteres Feistritztal"],
	["uMurt.", "unteres Murtal"],
	["unt.steir.Raabt.", "unteres steirisches Raabtal"],
	["Aichfd.", "Aichfeld"],
	["mittl.obMurt.", "mittleres oberes Murtal"],
	["nwObMurgeb.", "nordwestliches Obermurgebiet"],
	["Obdachgeb.", "Obdachgebiet"],
	["obPölst.", "oberes Pölstal"],
	["Seckau.Beck.", "Seckauer Becken"],
	["sUmg.Judenbg.", "südliche Umgebung von Judenburg"],
	["sUmg.Zeltweg", "südliche Umgebung von Zeltweg"],
	["swObMurgeb.", "südwestliches Obermurgebiet"],
	["uPölst.", "unteres Pölstal"],
	["westl.obMurt.", "westliches oberes Murtal"],
	["Laßnitzt.", "Laßnitztal"],
	["nöWSt.", "nordöstliche Weststeiermark"],
	["nwWSt.", "nordwestliche Weststeiermark"],
	["Saggaut.", "Saggautal"],
	["Stainz.Hügelld.", "Stainzer Hügelland"],
	["Sulmt.", "Sulmtal"],
]);
