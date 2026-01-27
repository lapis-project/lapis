export interface Answer {
	annotation: string;
	response: string;
	phenomenon: string;
	variety: string;
}
export interface Coalesce {
	age: string;
	gender: string;
	informant_id: number;
	answers: Array<Answer>;
}

interface SurveyResponseProperty {
	age: string;
	gender: string;
	answers: Array<Answer>;
	informant_id: number;
}

export interface SurveyResponse {
	id: string;
	place_name: string;
	plz: number;
	lat: number;
	lon: number;
	informants: Array<Coalesce>;
	properties?: Array<SurveyResponseProperty>;
}

type Coordinates = Array<Array<Array<number>>>;

interface Properties {
	name: string;
	color: string;
	Dialektregion_Name?: string;
	count?: number | null;
	layer?: string;
	path?: string;
	objektart?: string;
	name_1?: string;
	name_2?: string;
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
