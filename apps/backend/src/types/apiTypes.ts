interface Category {
	id: string;
	name: string;
}

enum Status {
	DRAFT,
	PUBLISHED,
	ARCHIVED,
}

enum ResponseInflucenced {
	F,
}

interface User {
	role: string; // Enum
	username: string;
	id: string;
}

interface Article {
	id: number;
	user_id: number; // User Object
	author: User; // User Object
	category: Category;
	title: string;
	content: string;
	abstract: string;
	alias: string; // sanitasation of at creation of the article
	project: string;
	lang: string;
	publishedAt: string;
	updatedAt: string;
	bibliography: Array<string>;
	cover: string;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface ArticleCMS extends Article {
	status: Status;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface ArticleTeaser extends Omit<Article, "biblography" | "content"> {}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
interface QuestionResponse {
	responseText: string;
	timestampAudio: string;
	responseSelected: number;
	responseOrder: number;
	responseInfluenced: ResponseInflucenced;
}
