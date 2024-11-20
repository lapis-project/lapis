import { availableLangConst, postStatusConst, userRolesConst } from "@/config/config";
import {
	checkBibliographyExists,
	insertNewBibliography,
	insertNewBibliographyPost,
} from "@/db/cmsRepository";
import type { Availablelang, Poststatus, Userroles } from "@/types/db";

export function instanceOfPoststatus(object: unknown): object is Poststatus {
	return typeof object === "string" && postStatusConst.includes(object as Poststatus);
}

export function instanceOfAvailablelang(object: unknown): object is Availablelang {
	return typeof object === "string" && availableLangConst.includes(object as Availablelang);
}

export function instanceOfUserRole(object: unknown): object is Userroles {
	return typeof object === "string" && userRolesConst.includes(object as Userroles);
}

export async function insertBibliography(bibEntries: Array<string>, articleId: number) {
	// Link the bibliography to the article
	const existingBib = await checkBibliographyExists(bibEntries);
	const bibsToInsert = bibEntries.filter(
		(el) => !existingBib.some((bib) => bib.name_bibliography === el),
	);
	let newBibIds: Array<number> = [];
	if (bibsToInsert.length > 0) {
		newBibIds = (await insertNewBibliography(bibsToInsert)).map((el) => el.id);
	}
	const bibIds = existingBib.map((el) => el.id);
	await insertNewBibliographyPost(bibIds.concat(newBibIds), articleId);
}
