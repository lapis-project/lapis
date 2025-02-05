export interface BibliographyItemCreator {
	creatorType: string;
	firstName: string | null;
	lastName: string | null;
}

export interface BibliographyItem {
	key: string;
	bookTitle?: string;
	version: number;
	itemType: "book" | "bookSection" | "journalArticle" | "thesis" | "note";
	title: string;
	creators: Array<BibliographyItemCreator>;
	abstractNote: string;
	series: string;
	seriesNumber: string;
	volume: string;
	numberOfVolumes: string;
	edition: string;
	place: string;
	publisher: string;
	date: string;
	numPages: string;
	language: string;
	ISBN: string;
	shortTitle: string;
	url: string;
	accessDate: string;
	archive: string;
	archiveLocation: string;
	libraryCatalog: string;
	callNumber: string;
	rights: string;
	extra: string;
	tags: Array<string>;
	collections: Array<string>;
	relations: Record<string, unknown>;
	dateAdded: string;
	dateModified: string;
	university?: string;
	publicationTitle?: string;
	pages?: string;
	doi?: string;
}
