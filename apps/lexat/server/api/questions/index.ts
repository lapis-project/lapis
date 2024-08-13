import { defineEventHandler, getQuery } from "h3";

import * as fr1 from "@/assets/data/fr1.json";
import * as fr2 from "@/assets/data/fr2.json";
import * as fr3 from "@/assets/data/fr3.json";
import * as fr4 from "@/assets/data/fr4.json";
import * as fr5 from "@/assets/data/fr5.json";
import * as fr6 from "@/assets/data/fr6.json";
import * as fr7 from "@/assets/data/fr7.json";
import * as fr8 from "@/assets/data/fr8.json";
import * as fr9 from "@/assets/data/fr9.json";
import * as fr10 from "@/assets/data/fr10.json";
import * as fr11 from "@/assets/data/fr11.json";
import * as fr12 from "@/assets/data/fr12.json";
import * as fr13 from "@/assets/data/fr13.json";
import * as fr14 from "@/assets/data/fr14.json";
import * as fr15 from "@/assets/data/fr15.json";
import * as fr16 from "@/assets/data/fr16.json";
import * as fr41 from "@/assets/data/fr41.json";
import type { SurveyCollection } from "@/types/feature-collection";

const questionData: Record<string, SurveyCollection> = {
	1: fr1.default, // augenlid
	2: fr2.default, // auswringen
	3: fr3.default, // backenzahn
	4: fr4.default, // barfuss
	5: fr5.default, // bauchschmerzen
	6: fr6.default, // begraebnis
	7: fr7.default, // brombeere
	8: fr8.default, // eidotter
	9: fr9.default, // walderdbeere
	10: fr10.default, // kehren
	11: fr11.default, // ferkel
	12: fr12.default, // fruehling
	13: fr13.default, // giesskanne
	14: fr14.default, // oma
	15: fr15.default, // opa
	16: fr16.default, // gurke
	17: fr41.default, // streichholz
};

export default defineEventHandler((event) => {
	const query = getQuery(event);
	const id = query.id as string | undefined;

	if (id && id in questionData) {
		return questionData[id];
	}
	throw createError({
		statusCode: 404,
		statusMessage: "Question not found",
	});
});
