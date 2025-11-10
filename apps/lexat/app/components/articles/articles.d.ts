import type { Article } from "@/types/api.ts";

export interface ArticleListEntry
	extends Pick<Article, "alias" | "authors" | "category" | "post_id" | "status" | "title"> {}
