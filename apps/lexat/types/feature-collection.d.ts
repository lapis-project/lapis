export interface SurveyCollection {
	type: string;
	features: Array<SurveyResponse>;
}

export interface SurveyResponse {
	type: string;
	id: number;
	title: string;
	geometry: {
		type: string;
		coordinates: Array<number>;
	};
	location: string;
	PLZ: string;
	properties: Array<Property>;
}

// export interface Geometry {
// 	type?: string;
// 	coordinates?: Array<number>; // TODO clean up actual data points in DB
// }

export interface Property {
	gender: string;
	age: string;
	under50: boolean;
	answers: Array<Answer>;
}

export interface Answer {
	reg: string;
	answer: string;
	anno: string;
}

type Coordinates = Array<Array<Array<number>>>;

interface Properties {
	name: string;
	color: string;
	pvbg_nr: number | string | null;
	shape_leng: number | null;
	shape_area: number | null;
	nuts3: number | null;
	nuts_name: string | null;
	count: number | null;
	layer: string;
	path: string;
}

interface Geometry {
	type: string;
	coordinates: Coordinates;
}

export interface RegionFeature {
	type: string;
	properties: Properties;
	geometry: Geometry;
}

export interface RegionFeatureCollection {
	type: string;
	name: string;
	crs: {
		type: string;
		properties: {
			name: string;
		};
	};
	features: Array<RegionFeature>;
}
