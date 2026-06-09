export interface WboeTableRow {
	id: string;
	lemma: string;
	wortart: string;
	lautung: string;
	bedeutungLautung: string;
	kontext: string;
	bedeutungKontext: string;
	sigle: string;
	staat: string;
	land: string;
	grossregion: string;
	kleinregion: string;
	gemeinde: string;
}

export interface MockDataSource {
	ID: string;
	HL: string | Array<string>;
	QU: string;
	QDB: string;
	BIBL?: string;
	Archivzeile: string;
	POS: string;
	Ort?: Array<string>;
	Großregion1?: Array<string>;
	Bundesland1?: Array<string>;
	Sigle1?: Array<string>;
	Kleinregion1?: Array<string>;
	Gemeinde1?: Array<string>;
	Page?: string;
	NL?: Array<string>;
	NR?: string | Array<string>;

	// Properties with special characters/keys
	"BD/LT*"?: string;
	"BD/KT*"?: Array<string>;
	"ANM/KT*"?: Array<string>;
	"DV/KT*"?: Array<string>;
	"GRAM/LT1"?: Array<string>;

	// KT Series
	KT1?: string | Array<string>;
	KT2?: Array<string>;
	"KL/KT1"?: string;
	"KL/KT2"?: string;

	// ZL Series
	"ZL1/KT1"?: string | Array<string>;
	"ZL2/KT1"?: string | Array<string>;
	"ZL3/KT1"?: string | Array<string>;
	"ZL4/KT1"?: string | Array<string>;
	"ZL5/KT1"?: string | Array<string>;

	"ZL1/KT2"?: string | Array<string>;
	"ZL2/KT2"?: string | Array<string>;
	"ZL3/KT2"?: string | Array<string>;
	"ZL4/KT2"?: string | Array<string>;
	"ZL5/KT2"?: string | Array<string>;

	// Teuthonista
	LT1_teuthonista?: string | Array<string>;
}

export interface MockDataItem {
	_id: string;
	_source: MockDataSource;
}

// If you want to type the entire outer object you exported previously:
export interface MockDataResponse {
	mockdata: Array<MockDataItem>;
}

function getStr(val: string | Array<string> | undefined): string {
	if (!val) return "";
	return Array.isArray(val) ? val.join(" | ") : val;
}

const mockData: Array<MockDataItem> = [
	{
		_id: "f244_qdb-d1e2585",
		_source: {
			"BD/LT*": "Februar ›LT1",
			HL: "Februar",
			QU: "Prantauer Diss.78",
			Page: "78",
			QDB: "{1C.3} NOTir.:mkDiss./Mda.Tir. ",
			BIBL: "PRANTAUER· (1933) S.",
			Ort: ["NOTir.:mkDiss./Mda.Tir."],
			Großregion1: ["1C.3 öNTir."],
			Archivzeile: "HK 244, f244#94.1 = fe0410.pla#94.1",
			POS: "Subst",
			Bundesland1: ["1C NTir."],
			ID: "f244_qdb-d1e2585",
			Sigle1: ["⚠", "1C.3"],
			LT1_teuthonista: ["fewrā⁽ʳ⁾", "≈fewrar"],
			NL: ["Februȧ́r", "≈Februar"],
		},
	},
	{
		_id: "f244_qdb-d1e2660",
		_source: {
			"BD/KT*": [
				"WAS DER FEBRUAR NICHT WILL, KOMMT ERST IM APRIL ›KT1",
				"DER HALBE FEBRUAR SOLL GEFRIEREN UND DER HALBE SIEDEN ›KT2",
			],
			HL: "Februar",
			QU: "Stainz; Troyer",
			Kleinregion1: ["3.3c Stainz.Hügelld."],
			KT2: [
				"da hålbete Februar [m,sg1]   soll gfri͡aßn, und der hålbete siadn",
				"≈da halbete Februar m,sg1 soll gfriaßn, und der halbete siadn",
			],
			KT1: [
				"Was der Februar [m,sg1]   nicht will, kom̄t erst im April",
				"≈Was der Februar m,sg1 nicht will, komt erst im April",
			],
			QDB: "{3.3c08} Stainz.Hügelld.:Laßnitzgeb.:sWSt.:WSt.:St. ",
			BIBL: "FbB.TROYER· (19xx) [SFb./EFb./WFb.2/Mtlg.]",
			Ort: ["Stainz/S. St."],
			"ANM/KT*": [
				"O: Warme Witterung ›BD/KT1",
				"O: zuerst Kälte und dann Schneeschmelze ›BD/KT2",
				"≈ANM O: ›BD zuerst Kälte und dann Schneeschmelze ›BD/KT2",
			],
			Großregion1: ["3.3 WStmk."],
			Archivzeile: "HK 244, f244#97.1 = fe0410.pla#97.1",
			POS: "Subst",
			Gemeinde1: ["3.3c08 Stainz"],
			Bundesland1: ["3 Stmk."],
			"KL/KT1": "Spruch",
			ID: "f244_qdb-d1e2660",
			"KL/KT2": "Spruch",
			Sigle1: ["3.3c08"],
		},
	},
	{
		_id: "f244_qdb-d1e2795",
		_source: {
			HL: ["(Fast)nacht", "≈Fastnacht"],
			QU: "Traun OÖ; Swoboda",
			Kleinregion1: ["5.2a nHausrv."],
			KT1: [
				"Sehr wohl gedeihet frühe Saat / Wenn Fastnacht schönes Wetter hat",
				"≈Sehr wohl gedeihet frühe Saat / Wenn Fastnacht schönes Wetter hat",
			],
			QDB: "{5.2a39} nHausrv.:Hausrv.:OÖ ",
			BIBL: "FbB.SWOBODA· (19xx) [SFb./Mtlg.]",
			Ort: ["Traun OÖ"],
			Großregion1: ["5.2 Hausrv."],
			Archivzeile: "HK 244, f244#102.1 = feb0411.pla#1.24",
			POS: "Subst",
			Gemeinde1: ["5.2a39 Traun"],
			Bundesland1: ["5 OÖ"],
			"KL/KT1": "Wetterregel",
			ID: "f244_qdb-d1e2795",
			Sigle1: ["5.2a39"],
			"DV/KT*": [
				"Aus dem alten Kräuterbuch: s.KT1 ›KT1",
				"≈ANM Aus dem alten Kräuterbuch: s.KT1 ›KT1",
			],
		},
	},
	{
		_id: "f244_qdb-d1e2870",
		_source: {
			HL: ["(Mattías)nacht", "≈Mattiasnacht"],
			QU: "Traun OÖ; Swoboda",
			Kleinregion1: ["5.2a nHausrv."],
			KT1: "Gefrierts auf St. Mathiasnacht / Ein ganzes Monat Frost bebracht",
			QDB: "{5.2a39} nHausrv.:Hausrv.:OÖ ",
			BIBL: "FbB.SWOBODA· (19xx) [SFb./Mtlg.]",
			Ort: ["Traun OÖ"],
			Großregion1: ["5.2 Hausrv."],
			Archivzeile: "HK 244, f244#105.1 = feb0411.pla#1.93",
			POS: "Subst",
			Gemeinde1: ["5.2a39 Traun"],
			Bundesland1: ["5 OÖ"],
			"KL/KT1": "Wetterregel",
			ID: "f244_qdb-d1e2870",
			Sigle1: ["5.2a39"],
			"DV/KT*": [
				"Aus dem alten Kräuterbuch: s.KT1 ›KT1",
				"≈ANM Aus dem alten Kräuterbuch: s.KT1 ›KT1",
			],
		},
	},
	{
		_id: "f244_qdb-d1e2895",
		_source: {
			HL: ["(Stůl)feier", "≈Stulfeier"],
			QU: "Traun OÖ; Swoboda",
			Kleinregion1: ["5.2a nHausrv."],
			KT1: [
				"Hat es auf Stuhlfeier schön gethan / Läßt sich die halbe Fasten wohl an",
				"≈Hat es auf Stuhlfeier schön gethan / Läßt sich die halbe Fasten wohl an",
			],
			QDB: "{5.2a39} nHausrv.:Hausrv.:OÖ ",
			BIBL: "FbB.SWOBODA· (19xx) [SFb./Mtlg.]",
			Ort: ["Traun OÖ"],
			Großregion1: ["5.2 Hausrv."],
			Archivzeile: "HK 244, f244#106.1 = feb0411.pla#1.116",
			POS: "Subst",
			Gemeinde1: ["5.2a39 Traun"],
			Bundesland1: ["5 OÖ"],
			"KL/KT1": "Wetterregel",
			ID: "f244_qdb-d1e2895",
			Sigle1: ["5.2a39"],
			"DV/KT*": [
				"Aus dem alten Kräuterbuch: s.KT1 ›KT1",
				"≈ANM Aus dem alten Kräuterbuch: s.KT1 ›KT1",
			],
		},
	},
	{
		_id: "f244_qdb-d1e2941",
		_source: {
			"BD/KT*": ["im Feber solls beim Tag rinnen UND bei der Nacht klingen ›KT1"],
			"ZL2/KT1": "NachtSubst",
			HL: "Februar",
			NR: [
				"72B4: Heilige im Februar (*); VN*; Bauernregeln",
				"≈72B4: Heilige im Februar * VN* Bauernregeln",
			],
			QU: "Radschin; Frasl",
			Kleinregion1: ["6.3a nwWaldv."],
			KT1: [
				"in Febroa souüs ban Tog rinna und ba da Nocht glingna",
				"≈in Febroa souüs ban Tog rinna und ba da Nocht glingna",
			],
			QDB: "{6.3a15} nwWaldv.:nWaldv.:wWaldv.:Waldv.:NÖ ",
			BIBL: "FbB.FRASL· (19xx) [SFb.]",
			Ort: ["Radschin in Gm. Kautzen NÖ [2o/1.]"],
			"ZL1/KT1": "rinnenVerb",
			Großregion1: ["6.3 Waldv."],
			Archivzeile: "HK 244, f244#108.1 = feb0411.pla#3.1",
			POS: "Subst",
			Gemeinde1: ["6.3a15 Kautzen"],
			Bundesland1: ["6 NÖ"],
			"KL/KT1": "Wetterregel",
			ID: "f244_qdb-d1e2941",
			"ZL3/KT1": "klingenVerb",
			Sigle1: ["6.3a15"],
		},
	},
	{
		_id: "f244_qdb-d1e2975",
		_source: {
			"BD/KT*": [
				'Der Feber sagt zum Jänner: "hätte ICH DIE MACHT WIE DU, ICH ließe DAS KÄLBLEIN erfrieren IN DER KUH ›KT1',
			],
			"ZL2/KT1": ["lâßenVerbkj,sg1", "≈laßen Verb kj,sg1"],
			HL: "Februar",
			NR: [
				"72B4 (erg.): Heilige im Februar (*); VN*; Bauernregeln",
				"≈72B4 erg.: Heilige im Februar * VN* Bauernregeln",
			],
			QU: "Smilau; Altrichter",
			KT1: [
				'Der Feber [m,sg1]   sagt zum Jänner: "hait ich d Mocht weï du, ich laisat s Kälbl dafreisən e da Kuh"',
				"≈Der Feber m,sg1 sagt zum Jänner: hait ich d Mocht wei du, ich laisat s Kälbl dafreisen e da Kuh",
			],
			QDB: "{wb0:CZ-Ig} mIgl.:nbair.SI ",
			BIBL: "FbB.ALTRICHTER· (19xx) [SFb./EFb./Mtlg.]Smilau Igl. (Tschech.)",
			"ZL4/KT1": ["(der)friesenVerb", "≈derfriesen Verb"],
			"ZL1/KT1": "MachtSubst",
			Archivzeile: "HK 244, f244#109.1 = feb0411.pla#4.1",
			POS: "Subst",
			ID: "f244_qdb-d1e2975",
			"ZL3/KT1": "KalbSubstD1,sg4",
			Sigle1: ["wb0:CZ-Ig"],
			"ZL5/KT1": ["KůSubst", "≈Ku Subst"],
			NL: ["Fęber", "≈Feber"],
		},
	},
	{
		_id: "f244_qdb-d1e3053",
		_source: {
			"BD/LT*": "Februar ›LT1",
			HL: "Februar",
			NR: [
				"68K5a (erg.): Februar; Ltg. (Feberer); altdt.Syn. (Hornung,*)",
				"≈68K5a erg.: Februar Ltg. Feberer altdt.Syn. Hornung,*",
			],
			QU: "Poysdf.; Kramny-Holzinger",
			Kleinregion1: ["6.4d nöWeinv."],
			QDB: "{6.4d18} nöWeinv.:nWeinv.:öWeinv.:Weinv.:NÖ ",
			BIBL: "FbB.KRAMNY·-HOLZINGER· (19xx) [SFb./Mtlg.]",
			Ort: ["(D/Gm./Bz.) Poysdf. NÖ"],
			Großregion1: ["6.4 Weinv."],
			Archivzeile: "HK 244, f244#111.1 = feb0411.pla#6.1",
			POS: "Subst",
			Gemeinde1: ["6.4d18 Poysdorf"],
			Bundesland1: ["6 NÖ"],
			ID: "f244_qdb-d1e3053",
			Sigle1: ["6.4d18"],
			LT1_teuthonista: "Fewa",
			NL: ["Fęber", "≈Feber"],
		},
	},
	{
		_id: "f244_qdb-d1e3080",
		_source: {
			"BD/LT*": "FEBRUAR ›LT1",
			HL: "Februar",
			NR: [
				"68K5a (erg.): Februar; Ltg. (Feberer); altdt.Syn. (Hornung,*)",
				"≈68K5a erg.: Februar Ltg. Feberer altdt.Syn. Hornung,*",
			],
			QU: "Hohenfurt; Swoboda",
			QDB: "{8.1b05} Umg.Bö.Krumau:wSBö.:SBö.:Bö. ",
			BIBL: "FbB.SWOBODA· (19xx) [SFb.]",
			Ort: ["Hohenfurth SBö."],
			Archivzeile: "HK 244, f244#112.1 = feb0411.pla#7.1",
			POS: "Subst",
			ID: "f244_qdb-d1e3080",
			Sigle1: ["8.1b05"],
			LT1_teuthonista: "Feber",
			NL: ["Fęber", "≈Feber"],
		},
	},
	{
		_id: "f244_qdb-d1e3136",
		_source: {
			"BD/LT*": "Februar ›LT1",
			HL: "Februar",
			NR: [
				"68K5a: Februar; Ltg. (Feberer); altdt.Syn. (Hornung,*)",
				"≈68K5a: Februar Ltg. Feberer altdt.Syn. Hornung,*",
			],
			QU: "Straßburg Umg.; Nagelmayer",
			Kleinregion1: ["2.2d obstGurkt.", "2.3b obGurkt.", "2.3c Krappfd.", "2.3d uGurkt."],
			QDB: "{2.2d,2.3b,2.3c,2.3d} Gurkt.:MKä.:Kä. ",
			BIBL: "FbB.NAGELMAYER· (19xx) [SFb./WFb.2/Mtlg.]",
			Ort: ["Gurkt.:MKä.:Kä."],
			Großregion1: ["2.2 MKtn.", "2.2 MKtn.", "2.2 MKtn.", "2.2 MKtn."],
			Archivzeile: "HK 244, f244#114.1 = feb0411.pla#9.1",
			POS: "Subst",
			Bundesland1: ["2 Ktn.", "2 Ktn.", "2 Ktn.", "2 Ktn."],
			ID: "f244_qdb-d1e3136",
			Sigle1: ["⚠", "2.2d", "2.3b", "2.3c", "2.3d"],
			LT1_teuthonista: ["Feb'r", "≈Febr"],
			NL: ["Fęber", "≈Feber"],
		},
	},
	{
		_id: "f244_qdb-d1e917",
		_source: {
			HL: "Februar",
			"ZL4/KT2": "MerzSubstsg3",
			Page: "87",
			QDB: "{2.2e01} wNockgeb.:vkPubl./Kä. ",
			BIBL: "MORO· (1952) S. [A-552 ]",
			Ort: ["wNockgeb.:vkPubl./Kä."],
			Gemeinde1: ["2.2e01 Bad Kleinkirchheim"],
			ID: "f244_qdb-d1e917",
			"ZL3/KT1": ["JârSubst", "≈Jar Subst"],
			Sigle1: ["⚠", "2.2e01"],
			"ZL3/KT2": "SunneSubstsg3",
			"BD/KT*": [
				"RAUHER WIND IM FEBRUAR, FOLGT EIN GUTES JAHR ›KT1",
				"WENN DIE KATZE IM FEBRUAR IN DER SONNE LIEGT, SITZT SIE IM MÄRZ HINTER DEM OFEN ›KT2",
			],
			"ZL2/KT1": ["gůtAdjfl", "≈gut Adj fl"],
			"ZL2/KT2": "KatzeSubst",
			QU: "Moro, Volkskundl.a.d.Kärnt.Nockgeb., Klagenf. (1952)87",
			Kleinregion1: ["2.2e Nockgeb."],
			KT2: [
				"Wånn die Kåtz in Februar in der Sunne liegt, sitzt sie in Mirz hintern Ofn",
				"≈Wann die Katz in Februar in der Sunne liegt, sitzt sie in Mirz hintern Ofn",
			],
			KT1: "Raucher Wind in Februar, folgt a guats J­ahr",
			"ZL1/KT1": "rauhAdjm,sg1,st",
			Großregion1: ["2.2 MKtn."],
			Archivzeile: "HK 244, f244#34.1 = fe0410.pla#33.1",
			"ZL1/KT2": "wannConj",
			POS: "Subst",
			Bundesland1: ["2 Ktn."],
			"KL/KT1": "Wetterregel",
			"KL/KT2": "Wetterregel",
			"ZL5/KT2": "OfenSubst",
		},
	},
	{
		_id: "f244_qdb-d1e1396",
		_source: {
			"GRAM/LT1": [" [m]", "≈m"],
			"BD/LT*": "Februar ›LT1",
			HL: "Februar",
			QU: "Bauer / Scheuringer, Münzkchn. uInnv. OÖ (1979)",
			Kleinregion1: ["5.1e westl.uInnv."],
			QDB: "{5.1e05} westl.uInnv.:OÖ ",
			BIBL: "Aufn.BAUER·/SCHEURINGER· (1979) [GaFb3; chTr]",
			Ort: ["Münzkn. OÖ"],
			Großregion1: ["5.1 Innv."],
			Archivzeile: "HK 244, f244#49.1 = fe0410.pla#48.1",
			POS: "Subst",
			Gemeinde1: ["5.1e05 Münzkirchen"],
			Bundesland1: ["5 OÖ"],
			ID: "f244_qdb-d1e1396",
			Sigle1: ["5.1e05"],
			LT1_teuthonista: ["vę́wru-a", "≈vewrua"],
			NL: ["Fębruar", "≈Februar"],
		},
	},
	{
		_id: "f244_qdb-d1e1450",
		_source: {
			"GRAM/LT1": [" [m+A]", "≈m+A"],
			"BD/LT*": "Februar ›LT1",
			HL: "Februar",
			QU: "Niedernsill Sa.; Bauer (1971)",
			Kleinregion1: ["4.2a obstSalzacht."],
			QDB: "{4.2a06} obstSalzacht.:Salzacht.: ObPinzg.:Sa. ",
			BIBL: "Aufn.BAUER· (1971) [GaFb2; wrTr]",
			Ort: ["Niedernsill Sa."],
			Großregion1: ["4.2 Pinzg."],
			Archivzeile: "HK 244, f244#51.1 = fe0410.pla#50.1",
			POS: "Subst",
			Gemeinde1: ["4.2a06 Niedernsill"],
			Bundesland1: ["4 Sbg."],
			ID: "f244_qdb-d1e1450",
			Sigle1: ["4.2a06"],
			LT1_teuthonista: ["dɒ február", "≈da februar"],
			NL: ["Februȧ́r", "≈Februar"],
		},
	},
	{
		_id: "f244_qdb-d1e1544",
		_source: {
			"GRAM/LT1": [" [m]", "≈m"],
			"BD/LT*": "Februar ›LT1",
			HL: "Februar",
			NR: "142.2",
			QU: "Malta in Kärnt.; Slg.Bauer",
			Kleinregion1: ["2.2b Maltat."],
			QDB: "{2.2b01} Maltat.:Liesergeb.:nwMKä.:nMKä.:wMKä.:MKä.:Kä.",
			Ort: ["Maltat.:Liesergeb.:nwMKä.:nMKä.:wMKä.:MKä.:Kä."],
			Großregion1: ["2.2 MKtn."],
			Archivzeile: "HK 244, f244#55.1 = fe0410.pla#54.1",
			POS: "Subst",
			Gemeinde1: ["2.2b01 Malta"],
			Bundesland1: ["2 Ktn."],
			ID: "f244_qdb-d1e1544",
			Sigle1: ["⚠", "2.2b01"],
			LT1_teuthonista: ["fębruār", "≈februar"],
			NL: ["Februȧ́r", "≈Februar"],
		},
	},
	{
		_id: "f244_qdb-d1e1618",
		_source: {
			"BD/LT*": "Februar ›LT1",
			HL: "Februar",
			QU: "Schwoich Tir.; Sinwel",
			Kleinregion1: ["1C.3e öUInnt."],
			QDB: "{1C.3e12} öUInnt.:UInnt.:Innt.:öNOTir.:NOTir.:öNTir.:NTir.:Tir. ",
			BIBL: "FbB.SINWEL· (19xx) [SFb./EFb.]",
			Ort: ["Schwoich NTir."],
			Großregion1: ["1C.3 öNTir."],
			Archivzeile: "HK 244, f244#58.1 = fe0410.pla#57.1",
			POS: "Subst",
			Gemeinde1: ["1C.3e12 Schwoich"],
			Bundesland1: ["1C NTir."],
			ID: "f244_qdb-d1e1618",
			Sigle1: ["1C.3e12"],
			LT1_teuthonista: ["Febrár", "≈Febrar"],
			NL: ["Februȧ́r", "≈Februar"],
		},
	},
	{
		_id: "f244_qdb-d1e1643",
		_source: {
			"GRAM/LT1": [" [m]", "≈m"],
			"BD/LT*": "Februar ›LT1",
			HL: "Februar",
			QU: "Bladen; L.",
			QDB: "{0.3b01} Plad. ",
			BIBL: "Aufn.LESSIAK· (1910) [wrTr]",
			Ort: ["Pladen Plad. ## ACHTG.: oft andere LT-O"],
			Archivzeile: "HK 244, f244#59.1 = fe0410.pla#58.1",
			POS: "Subst",
			ID: "f244_qdb-d1e1643",
			Sigle1: ["0.3b01"],
			LT1_teuthonista: ["fęwrār", "≈fewrar"],
			NL: ["Februȧ́r", "≈Februar"],
		},
	},
	{
		_id: "f244_qdb-d1e1668",
		_source: {
			"GRAM/LT1": [" [m]", "≈m"],
			"BD/LT*": "FEBRUAR ›LT1",
			HL: "Februar",
			NR: [
				"68K5a: Februar; Ltg. (Feberer); altdt.Syn. (Hornung,*)",
				"≈68K5a: Februar Ltg. Feberer altdt.Syn. Hornung,*",
			],
			QU: "Imst; Schatz",
			Kleinregion1: ["1C.1n wObInnt."],
			QDB: "{1C.1n01} wObInnt.:ObInnt.:Innt.:Tir.:wNTir.:NTir.:Tir. ",
			BIBL: "FbB.SCHATZ· (19xx) [SFb./Mtlg.]",
			Ort: ["Imst NTir."],
			Großregion1: ["1C.1 wNTir."],
			Archivzeile: "HK 244, f244#60.1 = fe0410.pla#59.1",
			POS: "Subst",
			Gemeinde1: ["1C.1n01 Imst"],
			Bundesland1: ["1C NTir."],
			ID: "f244_qdb-d1e1668",
			Sigle1: ["1C.1n01"],
			LT1_teuthonista: ["Februá̄r", "≈Februar"],
			NL: ["Februȧ́r", "≈Februar"],
		},
	},
	{
		_id: "f244_qdb-d1e1720",
		_source: {
			"BD/LT*": "Februar ›LT1",
			HL: "Februar",
			NR: [
				"68K5a: Februar; Ltg. (Feberer); altdt.Syn. (Hornung,*)",
				"≈68K5a: Februar Ltg. Feberer altdt.Syn. Hornung,*",
			],
			QU: "Weer; Prosch",
			Kleinregion1: ["1C.2a mInnt."],
			QDB: "{1C.2a29} mInnt.:Innt.:mNTir.:Tir. ",
			BIBL: "FbB.PROSCH· (19xx) [SFb./EFb./WFb.2]",
			Ort: ["Weer NTir."],
			Großregion1: ["1C.2 mNTir."],
			Archivzeile: "HK 244, f244#62.1 = fe0410.pla#61.1",
			POS: "Subst",
			Gemeinde1: ["1C.2a29 Weer"],
			Bundesland1: ["1C NTir."],
			ID: "f244_qdb-d1e1720",
			Sigle1: ["1C.2a29"],
			LT1_teuthonista: ["febrá̄r", "≈febrar"],
			NL: ["Februȧ́r", "≈Februar"],
		},
	},
	{
		_id: "f244_qdb-d1e1747",
		_source: {
			"BD/LT*": "Februar ›LT1",
			HL: "Februar",
			NR: [
				"68K5a: Februar; Ltg. (Feberer); altdt.Syn. (Hornung,*)",
				"≈68K5a: Februar Ltg. Feberer altdt.Syn. Hornung,*",
			],
			QU: "Großlobming; Geosich",
			Kleinregion1: ["3.1d mittl.obMurt."],
			QDB: "{3.1d03} mittl.obMurt.:obMurt.:mObMurgeb.:ObMurgeb.:sbair.ObSt.:ObSt.:St. ",
			BIBL: "FbB.GEOSICH· (191x:13-1935) [SFb.10,17,37,57-106/EFb.4-9/WFb.2/Mtlg.]",
			Ort: ["Gr.Lobming St."],
			Großregion1: ["3.1 sbair.ObStmk."],
			Archivzeile: "HK 244, f244#63.1 = fe0410.pla#62.1",
			POS: "Subst",
			Gemeinde1: ["3.1d03 Lobmingtal"],
			Bundesland1: ["3 Stmk."],
			ID: "f244_qdb-d1e1747",
			Sigle1: ["3.1d03"],
			LT1_teuthonista: ["Fĕbṙŭá̄ʳ", "≈Februar"],
			NL: ["Februȧ́r", "≈Februar"],
		},
	},
	{
		_id: "f244_qdb-d1e1854",
		_source: {
			"BD/LT*": "Februar ›LT1",
			HL: "Februar",
			NR: [
				"68K5a: Februar; Ltg. (Feberer); altdt.Syn. (Hornung,*)",
				"≈68K5a: Februar Ltg. Feberer altdt.Syn. Hornung,*",
			],
			QU: "Radschin; Frasl",
			Kleinregion1: ["6.3a nwWaldv."],
			QDB: "{6.3a15} nwWaldv.:nWaldv.:wWaldv.:Waldv.:NÖ ",
			BIBL: "FbB.FRASL· (19xx) [SFb.]",
			Ort: ["Radschin in Gm. Kautzen NÖ [2o/1.]"],
			Großregion1: ["6.3 Waldv."],
			Archivzeile: "HK 244, f244#67.1 = fe0410.pla#66.1",
			POS: "Subst",
			Gemeinde1: ["6.3a15 Kautzen"],
			Bundesland1: ["6 NÖ"],
			ID: "f244_qdb-d1e1854",
			Sigle1: ["6.3a15"],
			LT1_teuthonista: ["Febrou̱a", "≈Febroua"],
		},
	},
];

export default defineEventHandler((event) => {
	const query = getQuery(event);

	const page = Number(query.page ?? 1);
	const pageSize = Number(query.pageSize ?? 10);

	const allData: Array<WboeTableRow> = mockData.map((item) => {
		const sigle = getStr(item._source.Sigle1);

		let calculatedStaat = "AT";

		if (sigle.includes("CZ")) {
			calculatedStaat = "CZ";
		} else if (sigle.includes("SI")) {
			calculatedStaat = "SI";
		} else if (sigle.includes("IT")) {
			calculatedStaat = "IT";
		}

		return {
			id: item._id,
			lemma: getStr(item._source.HL),
			wortart: getStr(item._source.POS),
			lautung: getStr(item._source.LT1_teuthonista),
			bedeutungLautung: getStr(item._source["BD/LT*"]),
			kontext: getStr(item._source.KT1),
			bedeutungKontext: getStr(item._source["BD/KT*"]),
			sigle: sigle,
			staat: calculatedStaat,
			land: getStr(item._source.Bundesland1),
			grossregion: getStr(item._source.Großregion1),
			kleinregion: getStr(item._source.Kleinregion1),
			gemeinde: getStr(item._source.Gemeinde1),
		};
	});
	const start = (page - 1) * pageSize;
	const end = start + pageSize;

	return {
		data: allData.slice(start, end),
		totalCount: allData.length,
		page,
		pageSize,
	};
});
