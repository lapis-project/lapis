export interface Article {
	id: number;
	authors: Array<User>;
	category: string;
	title: string;
	content: string;
	abstract: string;
	alias: string;
	project: string;
	publishedAt: Date;
	updatedAt: Date;
	createdAt: Date;
	status: string;
	bibliography?: Array<string>;
	cover?: string;
	phenomenon?: string;
}

export interface User {
	role?: string; // Enum
	username?: string;
	firstName: string;
	lastName: string;
	id: number;
}
