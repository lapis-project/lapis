import type { Availablelang, Poststatus } from "@/types/db";

export interface Category {
	id: string;
	name: string;
}

export const Status = {
	DRAFT: "Draft",
	PUBLISHED: "Published",
	ARCHIVED: "Archived",
} as const;

export const ResponseInflucenced = {
	F: "F",
} as const;

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
	post_type_id: number | null;
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
	cover?: string | null;
	cover_alt: string | null;
	creator_id: number;
	citation: string | null;
}

export interface ArticleCMS extends Article {
	status: typeof Status;
}

export interface ArticleTeaser extends Omit<Article, "biblography" | "content"> {}

export interface QuestionResponse {
	responseText: string;
	timestampAudio: string;
	responseSelected: number;
	responseOrder: number;
	responseInfluenced: typeof ResponseInflucenced;
}

export interface Author {
	firstname: string | null;
	lastname: string | null;
}

export interface ArticleTeaserAPI {
	post_id: number;
	title: string;
	alias: string;
	abstract: string | null;
	post_type: string;
	authors: Array<Author>;
	cover: string | null;
	cover_alt: string | null;
	published_at: string | null;
}

export interface PagedArticlesResult {
	articles: Array<ArticleTeaserAPI> | null; // json_agg can return null
	total: number;
}
