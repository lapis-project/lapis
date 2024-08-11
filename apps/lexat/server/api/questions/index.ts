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
	augenlid: fr1.default,
	auswringen: fr2.default,
	backenzahn: fr3.default,
	barfuss: fr4.default,
	bauchschmerzen: fr5.default,
	begraebnis: fr6.default,
	brombeere: fr7.default,
	eidotter: fr8.default,
	walderdbeere: fr9.default,
	kehren: fr10.default,
	ferkel: fr11.default,
	fruehling: fr12.default,
	giesskanne: fr13.default,
	oma: fr14.default,
	opa: fr15.default,
	gurke: fr16.default,
	streichholz: fr41.default,
};

export default defineEventHandler((event) => {
	const query = getQuery(event);
	const question = query.question as string | undefined;

	if (question && question in questionData) {
		return questionData[question];
	}
	throw createError({
		statusCode: 404,
		statusMessage: "Question not found",
	});
});
