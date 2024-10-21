import type { Availablelang, Poststatus } from "@/types/db";

const poststatus = ["Draft", "Published", "ReadyToPublish", "Unpublished"] as const;

const availableLang = ["de", "en"] as const;

export function instanceOfPoststatus(object: unknown): object is Poststatus {
	return typeof object === "string" || poststatus.includes(object as Poststatus);
}

export function instanceOfAvailablelang(object: unknown): object is Availablelang {
	return typeof object === "string" || availableLang.includes(object as Availablelang);
}
