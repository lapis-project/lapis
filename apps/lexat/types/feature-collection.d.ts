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

export interface SurveyResponse {
	id: string;
	place_name: string;
	plz: number;
	lat: number;
	lon: number;
	coalesce: Array<Coalesce>;
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
