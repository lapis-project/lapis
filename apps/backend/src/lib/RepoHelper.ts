import {
	checkBibliographyExists,
	insertNewBibliography,
	insertNewBibliographyPost,
} from "@/db/cmsRepository";
import type { Availablelang, Poststatus, Userroles } from "@/types/db";

const poststatus = ["Draft", "Published", "ReadyToPublish", "Unpublished"] as const;

const availableLang = ["de", "en"] as const;

const userRoles = ["admin", "editor"] as const;

export function instanceOfPoststatus(object: unknown): object is Poststatus {
	return typeof object === "string" || poststatus.includes(object as Poststatus);
}

export function instanceOfAvailablelang(object: unknown): object is Availablelang {
	return typeof object === "string" || availableLang.includes(object as Availablelang);
}

export function instanceOfUserRole(object: unknown): object is Userroles {
	return typeof object === "string" || userRoles.includes(object as Userroles);
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
