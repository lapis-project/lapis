import type { Availablelang, Poststatus } from "@/types/db";

export interface Category {
	id: string;
	name: string;
}

export enum Status {
	DRAFT,
	PUBLISHED,
	ARCHIVED,
}

export enum ResponseInflucenced {
	F,
}

export interface UserObject {
	email: string | null;
	firstname: string | null;
	lastname: string | null;
	role_name: string | null; // Enum
	username: string;
	id: number;
}

export interface Article {
	id?: number;
	user_id?: number; // User Object
	author?: UserObject; // User Object
	category?: Poststatus;
	post_type_id: number;
	post_status: Poststatus;
	title: string;
	content: string | null;
	abstract: string | null;
	alias: string; // sanitasation of at creation of the article
	project?: string;
	lang: Availablelang;
	publishedAt: Date | null;
	updatedAt: Date;
	bibliography: Array<string>;
	cover: string | null;
}

export interface ArticleCMS extends Article {
	status: Status;
}

export interface ArticleTeaser extends Omit<Article, "biblography" | "content"> {}

export interface QuestionResponse {
	responseText: string;
	timestampAudio: string;
	responseSelected: number;
	responseOrder: number;
	responseInfluenced: ResponseInflucenced;
}
