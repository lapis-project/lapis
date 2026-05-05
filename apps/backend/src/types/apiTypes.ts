import type { Availablelang, Poststatus } from "@/types/db.ts";

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

export interface ArticleTeaser extends Omit<Article, "biblography" | "content"> {}

export interface QuestionResponse {
	responseText: string;
	timestampAudio: string;
	responseSelected: number;
	responseOrder: number;
	responseInfluenced: typeof ResponseInflucenced;
}

export interface CmsAuthor {
	user_id: number;
	username: string;
	email: string;
	firstname: string;
	lastname: string;
}

export interface CmsArticle {
	post_id: number;
	title: string;
	alias: string;
	content: string;
	abstract: string;
	status: string | null;
	post_type: string;
	authors: Array<CmsAuthor>;
}

export interface PagesCMSArticleResult {
	articles: Array<CmsArticle>;
	total: number;
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

export interface Token {
	token_id: number;
	token_reihung: number;
	ortho: string;
	phon: string;
	text_in_ortho: string;
	pos: string;
	token_type: string;
}

export interface Events {
	event_id: number;
	start_time: string;
	end_time: string;
	token_count: string;
	tokens: Array<Token>;
}

export interface DataEvent {
	informant: number;
	event_count: number;
	events: Array<Events>;
}

export interface EventTranscript {
	name: string;
	data: Array<DataEvent>;
}

export interface TranscriptJsonFormat {
	transcript_data: Array<{
		token_id: number;
		transcript_id_id: number;
		ID_Inf_id: number;
		start_time: string;
		end_time: string;
		token_reihung: number;
		ortho: string;
		phon: string;
		text_in_ortho: string;
		sppos: string;
		sptag: string;
		splemma: string;
		spdep: string;
		spenttype: string;
		tags: Array<{
			tag_reihung: Array<number>;
			tag_name: string;
			tag_id: Array<number>;
			tag: Array<string>;
			tag_gene: Array<number>;
		}>;
		tokenset_ids: Array<number>;
	}>;
	unique_informant_ids: Array<number>;
}

export interface Tag {
	tag: string;
	type: number;
}

export interface ZoteroCollectionData {
	key: string;
	version: number;
	itemType: string;
	title: string;
	creators: Array<{
		creatorType: string;
		firstName: string;
		lastName: string;
	}>;
	abstractNote: string;
	note: string;
	publicationTitle: string;
	publisher: string;
	place: string;
	date: string;
	volume: string;
	issue: string;
	section: string;
	partNumber: string;
	partTitle: string;
	pages: string;
	series: string;
	seriesTitle: string;
	seriesText: string;
	journalAbbreviation: string;
	DOI: string;
	citationKey: string;
	url: string;
	accessDate: string;
	PMID: string;
	PMCID: string;
	ISSN: string;
	archive: string;
	archiveLocation: string;
	shortTitle: string;
	language: string;
	libraryCatalog: string;
	callNumber: string;
	rights: string;
	extra: string;
	tags: Array<Tag>;
	collections: Array<string>;
	dateAdded: string; // ISO 8601 string
	dateModified: string; // ISO 8601 string
}

export interface ZoteroCollection {
	key: string;
	version: number;
	library: {
		type: string;
		id: number;
		name: string;
	};
	meta: {
		createdByUser: {
			id: number;
			username: string;
			name: string;
		};
		creatorSummary: string;
		parsedDate: string;
	};
	data: ZoteroCollectionData;
}
