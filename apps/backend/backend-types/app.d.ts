/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-empty-object-type */
import type { Env } from "hono";
import type * as hono_hono_base from "hono/hono-base";
import type * as hono_types from "hono/types";
import type { ColumnType } from "kysely";
import type { Session, User } from "lucia";

/**
 * Extracts a column type.
 */
type ExtractColumnType<DB, TB extends keyof DB, C> = {
	[T in TB]: C extends keyof DB[T] ? DB[T][C] : never;
}[TB];

type Availablelang = "de" | "en";

type Generated<T> =
	T extends ColumnType<infer S, infer I, infer U>
		? ColumnType<S, I | undefined, U>
		: ColumnType<T, T | undefined, T>;

type Inactivetype = "active" | "inactive";

type Poststatus = "Draft" | "Published" | "ReadyToPublish" | "Unpublished";

type Timestamp = ColumnType<Date, Date | string, Date | string>;

type Userroles = "admin" | "editor" | "superadmin";

interface AgeGroup {
	age_group_name: string | null;
	id: Generated<number>;
	lower_limit: number | null;
	upper_limit: number | null;
}

interface Analysis {
	created_at: Timestamp | null;
	id: Generated<number>;
	url_long: string | null;
	url_short: string | null;
	user_id: number | null;
}

interface AnalysisPhenomenon {
	analysis_id: number;
	phenomenon_id: number;
}

interface Annotation {
	annotation_name: string | null;
	description: string | null;
	id: Generated<number>;
	project_id: number | null;
}

interface AnnotationInstance {
	annotation_id: number;
	instance_id: number;
}

interface AnnotationResponse {
	annotation_id: number;
	response_id: number;
}

interface AnnotationTagset {
	annotation_id: number | null;
	id: Generated<number>;
	tagset_id: number | null;
}

interface AnnotationToken {
	annotation_id: number;
	token_id: number;
}

interface Bibliography {
	comment: string | null;
	id: Generated<number>;
	name_bibliography: string | null;
}

interface BibliographyPhenomenon {
	bibliography_id: number;
	phenomenon_id: number;
}

interface BibliographyPost {
	bibliography_id: number;
	post_id: number;
}

interface BibliographySource {
	bibliography_id: number;
	source_id: number;
}

interface EducationLevel {
	description: string | null;
	education_level_name: string | null;
	id: Generated<number>;
}

interface Informant {
	age_group_id: number | null;
	comment: string | null;
	education_level_id: number | null;
	gender: string | null;
	id: Generated<number>;
	survey_id: number | null;
}

interface InformantLivesInPlace {
	informant_id: number;
	place_id: number;
}

interface Instance {
	comment: string | null;
	id: Generated<number>;
	source_text: string | null;
	user_id: number | null;
}

interface InstanceSource {
	instance_id: number;
	source_id: number;
}

interface LingLevelPhenomenon {
	ling_level_id: number;
	phenomenon_id: number;
}

interface LingLevels {
	description: string | null;
	id: Generated<number>;
	ling_level_name: string | null;
}

interface Phenomenon {
	description: string | null;
	id: Generated<number>;
	phenomenon_name: string | null;
}

interface PhenomenonPost {
	phenomenon_id: number;
	post_id: number;
}

interface PhenomenonTagset {
	phenomenon_id: number;
	tagset_id: number;
}

interface PhenomenonTask {
	phenomenon_id: number;
	task_id: number;
}

interface Place {
	alternate_names: string | null;
	geoname_id: number | null;
	id: Generated<number>;
	lat: number | null;
	lon: number | null;
	place_name: string | null;
	plz: number | null;
	shape: string | null;
}

interface PlaceSource {
	place_id: number;
	source_id: number;
}

interface PlaceSurveyConducted {
	id: Generated<number>;
	place_id: number | null;
	survey_conducted_id: number | null;
}

interface Post {
	abstract: string | null;
	alias: string | null;
	content: string | null;
	cover: string | null;
	cover_alt: string | null;
	created_at: Generated<Timestamp | null>;
	id: Generated<number>;
	lang: Availablelang | null;
	post_status: Poststatus | null;
	post_type_id: number | null;
	published_at: Timestamp | null;
	title: string | null;
	updated_at: Generated<Timestamp | null>;
	citation: string | null;
	creator_id: number | null;
}

interface PostSource {
	post_id: number;
	source_id: number;
}

interface PostType {
	description: string | null;
	id: Generated<number>;
	post_type_name: string | null;
}

interface Project {
	description: string | null;
	duration: string | null;
	id: Generated<number>;
	is_subproject: boolean | null;
	main_project_id: number | null;
	project_name: string | null;
}

interface ProjectAnalysis {
	analysis_id: number;
	project_id: number;
}

interface ProjectBibliography {
	bibliography_id: number;
	project_id: number;
}

interface ProjectPost {
	post_id: number;
	project_id: number;
}

interface ProjectSource {
	project_id: number;
	source_id: number;
}

interface ProjectSurvey {
	project_id: number;
	survey_id: number;
}

interface ProjectTagset {
	project_id: number;
	tagset_id: number;
}

interface Response {
	id: Generated<number>;
	informant_id: number | null;
	response_influenced: boolean | null;
	response_order: number | null;
	response_selected: boolean | null;
	response_text: string | null;
	task_id: number | null;
	timestamp_audio: string | null;
}

interface Source {
	bibtex: string | null;
	id: Generated<number>;
	link: string | null;
	source_name: string | null;
}

interface Survey {
	description: string | null;
	id: Generated<number>;
	source_url: string | null;
	survey_name: string | null;
	survey_period_end: Timestamp | null;
	survey_period_start: Timestamp | null;
	survey_type_id: number | null;
}

interface SurveyConducted {
	audio_link: string | null;
	comment: string | null;
	conducted_on: Timestamp | null;
	digitization: boolean | null;
	id: Generated<number>;
	instance_id: number | null;
	survey_id: number | null;
}

interface SurveyContainsTask {
	survey_id: number;
	task_id: number;
}

interface SurveyContainsVariety {
	survey_id: number;
	variety_id: number;
}

interface SurveyType {
	description: string | null;
	id: Generated<number>;
	survey_type_name: string | null;
}

interface Tagset {
	description: string | null;
	id: Generated<number>;
	tagset_name: string | null;
}

interface Task {
	comment: string | null;
	id: Generated<number>;
	order_stimulus: number | null;
	stimulus_media: string | null;
	stimulus_text: string | null;
	task_name: string | null;
	task_type_id: number | null;
}

interface TaskType {
	description: string | null;
	id: Generated<number>;
	task_type_name: string | null;
}

interface TaskVariety {
	task_id: number;
	variety_id: number;
}

interface Token {
	eye_dialect_transcription: string | null;
	id: Generated<number>;
	informant_id: number | null;
	orthological_transcription: string | null;
	phonetic_transcription: string | null;
	survey_conducted_id: number | null;
}

interface UserAccount {
	association: string | null;
	email: string;
	firstname: string | null;
	id: Generated<number>;
	inactive: Inactivetype | null;
	lastname: string | null;
	orcid_id: string | null;
	password: string;
	project_member: boolean | null;
	username: string | null;
}

interface UserBibliography {
	bibliography_id: number;
	user_id: number;
}

interface UserHasRole {
	role_id: number;
	user_id: number;
}

interface UserPost {
	post_id: number;
	user_id: number;
}

interface UserProject {
	project_id: number;
	user_id: number;
}

interface UserRoles {
	description: string | null;
	id: Generated<number>;
	role_name: Userroles | null;
}

interface UserSession {
	created_at: Timestamp | null;
	expires_at: Timestamp | null;
	id: string;
	session_id: string | null;
	user_id: number | null;
}

interface Variety {
	comment: string | null;
	id: Generated<number>;
	iso_code: string | null;
	variety_id: number | null;
	variety_name: string | null;
}

interface DB {
	age_group: AgeGroup;
	analysis: Analysis;
	analysis_phenomenon: AnalysisPhenomenon;
	annotation: Annotation;
	annotation_instance: AnnotationInstance;
	annotation_response: AnnotationResponse;
	annotation_tagset: AnnotationTagset;
	annotation_token: AnnotationToken;
	bibliography: Bibliography;
	bibliography_phenomenon: BibliographyPhenomenon;
	bibliography_post: BibliographyPost;
	bibliography_source: BibliographySource;
	education_level: EducationLevel;
	informant: Informant;
	informant_lives_in_place: InformantLivesInPlace;
	instance: Instance;
	instance_source: InstanceSource;
	ling_level_phenomenon: LingLevelPhenomenon;
	ling_levels: LingLevels;
	phenomenon: Phenomenon;
	phenomenon_post: PhenomenonPost;
	phenomenon_tagset: PhenomenonTagset;
	phenomenon_task: PhenomenonTask;
	place: Place;
	place_source: PlaceSource;
	place_survey_conducted: PlaceSurveyConducted;
	post: Post;
	post_source: PostSource;
	post_type: PostType;
	project: Project;
	project_analysis: ProjectAnalysis;
	project_bibliography: ProjectBibliography;
	project_post: ProjectPost;
	project_source: ProjectSource;
	project_survey: ProjectSurvey;
	project_tagset: ProjectTagset;
	response: Response;
	source: Source;
	survey: Survey;
	survey_conducted: SurveyConducted;
	survey_contains_task: SurveyContainsTask;
	survey_contains_variety: SurveyContainsVariety;
	survey_type: SurveyType;
	tagset: Tagset;
	task: Task;
	task_type: TaskType;
	task_variety: TaskVariety;
	token: Token;
	user_account: UserAccount;
	user_bibliography: UserBibliography;
	user_has_role: UserHasRole;
	user_post: UserPost;
	user_project: UserProject;
	user_roles: UserRoles;
	user_session: UserSession;
	variety: Variety;
}

interface Context extends Env {
	Variables: {
		user: User | null;
		session: Session | null;
		role: Userroles | null;
	};
}

declare const app: hono_hono_base.HonoBase<
	Context,
	| ({
			"*": {};
	  } & {
			"/": {
				$get: {
					input: {};
					output: "OK";
					outputFormat: "json";
					status: 201;
				};
			};
	  })
	| hono_types.MergeSchemaPath<
			{
				"/articles/:project": {
					$get:
						| {
								input: {
									param: {
										project: string;
									};
								};
								output: "Provided projectId is not a number";
								outputFormat: "json";
								status: 400;
						  }
						| {
								input: {
									param: {
										project: string;
									};
								};
								output: "Provided search term is not a string";
								outputFormat: "json";
								status: 400;
						  }
						| {
								input: {
									param: {
										project: string;
									};
								};
								output: "Provided page number is not a number";
								outputFormat: "json";
								status: 400;
						  }
						| {
								input: {
									param: {
										project: string;
									};
								};
								output: "Provided offset number is not a number";
								outputFormat: "json";
								status: 400;
						  }
						| {
								input: {
									param: {
										project: string;
									};
								};
								output: "Provided pagesize number is not a number";
								outputFormat: "json";
								status: 400;
						  }
						| {
								input: {
									param: {
										project: string;
									};
								};
								output: "Provided language is not a string";
								outputFormat: "json";
								status: 400;
						  }
						| {
								input: {
									param: {
										project: string;
									};
								};
								output: {
									prev: string | null;
									next: string | null;
									articles: Array<{
										post_id: number;
										title: string;
										alias: string;
										abstract: string;
										post_type: string;
										authors: any;
										cover: string;
										cover_alt: string;
										published_at: string;
									}>;
									currentPage: string;
									totalResults: number;
								};
								outputFormat: "json";
								status: 200;
						  };
				};
			} & {
				"/detail/:alias": {
					$get:
						| {
								input: {
									param: {
										alias: string;
									};
								};
								output: "Provided alias is not a string";
								outputFormat: "json";
								status: 400;
						  }
						| {
								input: {
									param: {
										alias: string;
									};
								};
								output: {
									article:
										| {
												abstract: string | null;
												alias: string | null;
												content: string | null;
												cover: string | null;
												cover_alt: string | null;
												created_at: string | null;
												lang: Availablelang | null;
												published_at: string | null;
												title: string | null;
												updated_at: string | null;
												citation: string | null;
												post_type_name: string | null;
												post_id: number;
												creator_firstname: string | null;
												creator_lastname: string | null;
												phenomenon: Array<{
													phenomenon_id: number | null;
													name: string | null;
												}>;
												bibliography: Array<{
													name: string | null;
												}>;
												authors: Array<{
													firstname: string | null;
													lastname: string | null;
												}>;
										  }
										| undefined;
								};
								outputFormat: "json";
								status: 200;
						  };
				};
			},
			"/articles"
	  >
	| hono_types.MergeSchemaPath<
			{
				"/survey/:project": {
					$get:
						| {
								input: {
									param: {
										project: string;
									};
								};
								output: "Project Id is required";
								outputFormat: "json";
								status: 400;
						  }
						| {
								input: {
									param: {
										project: string;
									};
								};
								output: Array<{
									id: number;
									description: string | null;
									phenomenon_name: string | null;
								}>;
								outputFormat: "json";
								status: 200;
						  };
				};
			} & {
				"/": {
					$get:
						| {
								input: {};
								output: "Phenomenon Id is required";
								outputFormat: "json";
								status: 400;
						  }
						| {
								input: {};
								output: Array<{
									[x: string]: any;
									id: number;
									project_id: ExtractColumnType<
										DB & {
											annotation_data: {
												informant_id: number | null;
												annotations: Array<{
													annotation: string | null;
													response: string | null;
													phenomenon: string | null;
													variety: string | null;
												}>;
											};
										},
										| "age_group"
										| "annotation"
										| "annotation_response"
										| "annotation_tagset"
										| "informant"
										| "informant_lives_in_place"
										| "phenomenon"
										| "phenomenon_tagset"
										| "phenomenon_task"
										| "place"
										| "response"
										| "tagset"
										| "task"
										| "task_variety"
										| "variety"
										| "annotation_data",
										"project_id"
									>;
									description: ExtractColumnType<
										DB & {
											annotation_data: {
												informant_id: number | null;
												annotations: Array<{
													annotation: string | null;
													response: string | null;
													phenomenon: string | null;
													variety: string | null;
												}>;
											};
										},
										| "age_group"
										| "annotation"
										| "annotation_response"
										| "annotation_tagset"
										| "informant"
										| "informant_lives_in_place"
										| "phenomenon"
										| "phenomenon_tagset"
										| "phenomenon_task"
										| "place"
										| "response"
										| "tagset"
										| "task"
										| "task_variety"
										| "variety"
										| "annotation_data",
										"description"
									>;
									comment: ExtractColumnType<
										DB & {
											annotation_data: {
												informant_id: number | null;
												annotations: Array<{
													annotation: string | null;
													response: string | null;
													phenomenon: string | null;
													variety: string | null;
												}>;
											};
										},
										| "age_group"
										| "annotation"
										| "annotation_response"
										| "annotation_tagset"
										| "informant"
										| "informant_lives_in_place"
										| "phenomenon"
										| "phenomenon_tagset"
										| "phenomenon_task"
										| "place"
										| "response"
										| "tagset"
										| "task"
										| "task_variety"
										| "variety"
										| "annotation_data",
										"comment"
									>;
									phenomenon_name: ExtractColumnType<
										DB & {
											annotation_data: {
												informant_id: number | null;
												annotations: Array<{
													annotation: string | null;
													response: string | null;
													phenomenon: string | null;
													variety: string | null;
												}>;
											};
										},
										| "age_group"
										| "annotation"
										| "annotation_response"
										| "annotation_tagset"
										| "informant"
										| "informant_lives_in_place"
										| "phenomenon"
										| "phenomenon_tagset"
										| "phenomenon_task"
										| "place"
										| "response"
										| "tagset"
										| "task"
										| "task_variety"
										| "variety"
										| "annotation_data",
										"phenomenon_name"
									>;
									phenomenon_id: number;
									tagset_id: ExtractColumnType<
										DB & {
											annotation_data: {
												informant_id: number | null;
												annotations: Array<{
													annotation: string | null;
													response: string | null;
													phenomenon: string | null;
													variety: string | null;
												}>;
											};
										},
										| "age_group"
										| "annotation"
										| "annotation_response"
										| "annotation_tagset"
										| "informant"
										| "informant_lives_in_place"
										| "phenomenon"
										| "phenomenon_tagset"
										| "phenomenon_task"
										| "place"
										| "response"
										| "tagset"
										| "task"
										| "task_variety"
										| "variety"
										| "annotation_data",
										"tagset_id"
									>;
									tagset_name: ExtractColumnType<
										DB & {
											annotation_data: {
												informant_id: number | null;
												annotations: Array<{
													annotation: string | null;
													response: string | null;
													phenomenon: string | null;
													variety: string | null;
												}>;
											};
										},
										| "age_group"
										| "annotation"
										| "annotation_response"
										| "annotation_tagset"
										| "informant"
										| "informant_lives_in_place"
										| "phenomenon"
										| "phenomenon_tagset"
										| "phenomenon_task"
										| "place"
										| "response"
										| "tagset"
										| "task"
										| "task_variety"
										| "variety"
										| "annotation_data",
										"tagset_name"
									>;
									response_id: number;
									annotation_id: ExtractColumnType<
										DB & {
											annotation_data: {
												informant_id: number | null;
												annotations: Array<{
													annotation: string | null;
													response: string | null;
													phenomenon: string | null;
													variety: string | null;
												}>;
											};
										},
										| "age_group"
										| "annotation"
										| "annotation_response"
										| "annotation_tagset"
										| "informant"
										| "informant_lives_in_place"
										| "phenomenon"
										| "phenomenon_tagset"
										| "phenomenon_task"
										| "place"
										| "response"
										| "tagset"
										| "task"
										| "task_variety"
										| "variety"
										| "annotation_data",
										"annotation_id"
									>;
									informant_id: ExtractColumnType<
										DB & {
											annotation_data: {
												informant_id: number | null;
												annotations: Array<{
													annotation: string | null;
													response: string | null;
													phenomenon: string | null;
													variety: string | null;
												}>;
											};
										},
										| "age_group"
										| "annotation"
										| "annotation_response"
										| "annotation_tagset"
										| "informant"
										| "informant_lives_in_place"
										| "phenomenon"
										| "phenomenon_tagset"
										| "phenomenon_task"
										| "place"
										| "response"
										| "tagset"
										| "task"
										| "task_variety"
										| "variety"
										| "annotation_data",
										"informant_id"
									>;
									response_influenced: ExtractColumnType<
										DB & {
											annotation_data: {
												informant_id: number | null;
												annotations: Array<{
													annotation: string | null;
													response: string | null;
													phenomenon: string | null;
													variety: string | null;
												}>;
											};
										},
										| "age_group"
										| "annotation"
										| "annotation_response"
										| "annotation_tagset"
										| "informant"
										| "informant_lives_in_place"
										| "phenomenon"
										| "phenomenon_tagset"
										| "phenomenon_task"
										| "place"
										| "response"
										| "tagset"
										| "task"
										| "task_variety"
										| "variety"
										| "annotation_data",
										"response_influenced"
									>;
									response_order: ExtractColumnType<
										DB & {
											annotation_data: {
												informant_id: number | null;
												annotations: Array<{
													annotation: string | null;
													response: string | null;
													phenomenon: string | null;
													variety: string | null;
												}>;
											};
										},
										| "age_group"
										| "annotation"
										| "annotation_response"
										| "annotation_tagset"
										| "informant"
										| "informant_lives_in_place"
										| "phenomenon"
										| "phenomenon_tagset"
										| "phenomenon_task"
										| "place"
										| "response"
										| "tagset"
										| "task"
										| "task_variety"
										| "variety"
										| "annotation_data",
										"response_order"
									>;
									response_selected: ExtractColumnType<
										DB & {
											annotation_data: {
												informant_id: number | null;
												annotations: Array<{
													annotation: string | null;
													response: string | null;
													phenomenon: string | null;
													variety: string | null;
												}>;
											};
										},
										| "age_group"
										| "annotation"
										| "annotation_response"
										| "annotation_tagset"
										| "informant"
										| "informant_lives_in_place"
										| "phenomenon"
										| "phenomenon_tagset"
										| "phenomenon_task"
										| "place"
										| "response"
										| "tagset"
										| "task"
										| "task_variety"
										| "variety"
										| "annotation_data",
										"response_selected"
									>;
									response_text: ExtractColumnType<
										DB & {
											annotation_data: {
												informant_id: number | null;
												annotations: Array<{
													annotation: string | null;
													response: string | null;
													phenomenon: string | null;
													variety: string | null;
												}>;
											};
										},
										| "age_group"
										| "annotation"
										| "annotation_response"
										| "annotation_tagset"
										| "informant"
										| "informant_lives_in_place"
										| "phenomenon"
										| "phenomenon_tagset"
										| "phenomenon_task"
										| "place"
										| "response"
										| "tagset"
										| "task"
										| "task_variety"
										| "variety"
										| "annotation_data",
										"response_text"
									>;
									task_id: ExtractColumnType<
										DB & {
											annotation_data: {
												informant_id: number | null;
												annotations: Array<{
													annotation: string | null;
													response: string | null;
													phenomenon: string | null;
													variety: string | null;
												}>;
											};
										},
										| "age_group"
										| "annotation"
										| "annotation_response"
										| "annotation_tagset"
										| "informant"
										| "informant_lives_in_place"
										| "phenomenon"
										| "phenomenon_tagset"
										| "phenomenon_task"
										| "place"
										| "response"
										| "tagset"
										| "task"
										| "task_variety"
										| "variety"
										| "annotation_data",
										"task_id"
									>;
									timestamp_audio: ExtractColumnType<
										DB & {
											annotation_data: {
												informant_id: number | null;
												annotations: Array<{
													annotation: string | null;
													response: string | null;
													phenomenon: string | null;
													variety: string | null;
												}>;
											};
										},
										| "age_group"
										| "annotation"
										| "annotation_response"
										| "annotation_tagset"
										| "informant"
										| "informant_lives_in_place"
										| "phenomenon"
										| "phenomenon_tagset"
										| "phenomenon_task"
										| "place"
										| "response"
										| "tagset"
										| "task"
										| "task_variety"
										| "variety"
										| "annotation_data",
										"timestamp_audio"
									>;
									annotation_name: ExtractColumnType<
										DB & {
											annotation_data: {
												informant_id: number | null;
												annotations: Array<{
													annotation: string | null;
													response: string | null;
													phenomenon: string | null;
													variety: string | null;
												}>;
											};
										},
										| "age_group"
										| "annotation"
										| "annotation_response"
										| "annotation_tagset"
										| "informant"
										| "informant_lives_in_place"
										| "phenomenon"
										| "phenomenon_tagset"
										| "phenomenon_task"
										| "place"
										| "response"
										| "tagset"
										| "task"
										| "task_variety"
										| "variety"
										| "annotation_data",
										"annotation_name"
									>;
									order_stimulus: ExtractColumnType<
										DB & {
											annotation_data: {
												informant_id: number | null;
												annotations: Array<{
													annotation: string | null;
													response: string | null;
													phenomenon: string | null;
													variety: string | null;
												}>;
											};
										},
										| "age_group"
										| "annotation"
										| "annotation_response"
										| "annotation_tagset"
										| "informant"
										| "informant_lives_in_place"
										| "phenomenon"
										| "phenomenon_tagset"
										| "phenomenon_task"
										| "place"
										| "response"
										| "tagset"
										| "task"
										| "task_variety"
										| "variety"
										| "annotation_data",
										"order_stimulus"
									>;
									stimulus_media: ExtractColumnType<
										DB & {
											annotation_data: {
												informant_id: number | null;
												annotations: Array<{
													annotation: string | null;
													response: string | null;
													phenomenon: string | null;
													variety: string | null;
												}>;
											};
										},
										| "age_group"
										| "annotation"
										| "annotation_response"
										| "annotation_tagset"
										| "informant"
										| "informant_lives_in_place"
										| "phenomenon"
										| "phenomenon_tagset"
										| "phenomenon_task"
										| "place"
										| "response"
										| "tagset"
										| "task"
										| "task_variety"
										| "variety"
										| "annotation_data",
										"stimulus_media"
									>;
									stimulus_text: ExtractColumnType<
										DB & {
											annotation_data: {
												informant_id: number | null;
												annotations: Array<{
													annotation: string | null;
													response: string | null;
													phenomenon: string | null;
													variety: string | null;
												}>;
											};
										},
										| "age_group"
										| "annotation"
										| "annotation_response"
										| "annotation_tagset"
										| "informant"
										| "informant_lives_in_place"
										| "phenomenon"
										| "phenomenon_tagset"
										| "phenomenon_task"
										| "place"
										| "response"
										| "tagset"
										| "task"
										| "task_variety"
										| "variety"
										| "annotation_data",
										"stimulus_text"
									>;
									task_name: ExtractColumnType<
										DB & {
											annotation_data: {
												informant_id: number | null;
												annotations: Array<{
													annotation: string | null;
													response: string | null;
													phenomenon: string | null;
													variety: string | null;
												}>;
											};
										},
										| "age_group"
										| "annotation"
										| "annotation_response"
										| "annotation_tagset"
										| "informant"
										| "informant_lives_in_place"
										| "phenomenon"
										| "phenomenon_tagset"
										| "phenomenon_task"
										| "place"
										| "response"
										| "tagset"
										| "task"
										| "task_variety"
										| "variety"
										| "annotation_data",
										"task_name"
									>;
									task_type_id: ExtractColumnType<
										DB & {
											annotation_data: {
												informant_id: number | null;
												annotations: Array<{
													annotation: string | null;
													response: string | null;
													phenomenon: string | null;
													variety: string | null;
												}>;
											};
										},
										| "age_group"
										| "annotation"
										| "annotation_response"
										| "annotation_tagset"
										| "informant"
										| "informant_lives_in_place"
										| "phenomenon"
										| "phenomenon_tagset"
										| "phenomenon_task"
										| "place"
										| "response"
										| "tagset"
										| "task"
										| "task_variety"
										| "variety"
										| "annotation_data",
										"task_type_id"
									>;
									variety_id: ExtractColumnType<
										DB & {
											annotation_data: {
												informant_id: number | null;
												annotations: Array<{
													annotation: string | null;
													response: string | null;
													phenomenon: string | null;
													variety: string | null;
												}>;
											};
										},
										| "age_group"
										| "annotation"
										| "annotation_response"
										| "annotation_tagset"
										| "informant"
										| "informant_lives_in_place"
										| "phenomenon"
										| "phenomenon_tagset"
										| "phenomenon_task"
										| "place"
										| "response"
										| "tagset"
										| "task"
										| "task_variety"
										| "variety"
										| "annotation_data",
										"variety_id"
									>;
									iso_code: ExtractColumnType<
										DB & {
											annotation_data: {
												informant_id: number | null;
												annotations: Array<{
													annotation: string | null;
													response: string | null;
													phenomenon: string | null;
													variety: string | null;
												}>;
											};
										},
										| "age_group"
										| "annotation"
										| "annotation_response"
										| "annotation_tagset"
										| "informant"
										| "informant_lives_in_place"
										| "phenomenon"
										| "phenomenon_tagset"
										| "phenomenon_task"
										| "place"
										| "response"
										| "tagset"
										| "task"
										| "task_variety"
										| "variety"
										| "annotation_data",
										"iso_code"
									>;
									variety_name: ExtractColumnType<
										DB & {
											annotation_data: {
												informant_id: number | null;
												annotations: Array<{
													annotation: string | null;
													response: string | null;
													phenomenon: string | null;
													variety: string | null;
												}>;
											};
										},
										| "age_group"
										| "annotation"
										| "annotation_response"
										| "annotation_tagset"
										| "informant"
										| "informant_lives_in_place"
										| "phenomenon"
										| "phenomenon_tagset"
										| "phenomenon_task"
										| "place"
										| "response"
										| "tagset"
										| "task"
										| "task_variety"
										| "variety"
										| "annotation_data",
										"variety_name"
									>;
									annotations: Array<{
										annotation: string | null;
										response: string | null;
										phenomenon: string | null;
										variety: string | null;
									}>;
									age_group_id: ExtractColumnType<
										DB & {
											annotation_data: {
												informant_id: number | null;
												annotations: Array<{
													annotation: string | null;
													response: string | null;
													phenomenon: string | null;
													variety: string | null;
												}>;
											};
										},
										| "age_group"
										| "annotation"
										| "annotation_response"
										| "annotation_tagset"
										| "informant"
										| "informant_lives_in_place"
										| "phenomenon"
										| "phenomenon_tagset"
										| "phenomenon_task"
										| "place"
										| "response"
										| "tagset"
										| "task"
										| "task_variety"
										| "variety"
										| "annotation_data",
										"age_group_id"
									>;
									education_level_id: ExtractColumnType<
										DB & {
											annotation_data: {
												informant_id: number | null;
												annotations: Array<{
													annotation: string | null;
													response: string | null;
													phenomenon: string | null;
													variety: string | null;
												}>;
											};
										},
										| "age_group"
										| "annotation"
										| "annotation_response"
										| "annotation_tagset"
										| "informant"
										| "informant_lives_in_place"
										| "phenomenon"
										| "phenomenon_tagset"
										| "phenomenon_task"
										| "place"
										| "response"
										| "tagset"
										| "task"
										| "task_variety"
										| "variety"
										| "annotation_data",
										"education_level_id"
									>;
									gender: ExtractColumnType<
										DB & {
											annotation_data: {
												informant_id: number | null;
												annotations: Array<{
													annotation: string | null;
													response: string | null;
													phenomenon: string | null;
													variety: string | null;
												}>;
											};
										},
										| "age_group"
										| "annotation"
										| "annotation_response"
										| "annotation_tagset"
										| "informant"
										| "informant_lives_in_place"
										| "phenomenon"
										| "phenomenon_tagset"
										| "phenomenon_task"
										| "place"
										| "response"
										| "tagset"
										| "task"
										| "task_variety"
										| "variety"
										| "annotation_data",
										"gender"
									>;
									survey_id: ExtractColumnType<
										DB & {
											annotation_data: {
												informant_id: number | null;
												annotations: Array<{
													annotation: string | null;
													response: string | null;
													phenomenon: string | null;
													variety: string | null;
												}>;
											};
										},
										| "age_group"
										| "annotation"
										| "annotation_response"
										| "annotation_tagset"
										| "informant"
										| "informant_lives_in_place"
										| "phenomenon"
										| "phenomenon_tagset"
										| "phenomenon_task"
										| "place"
										| "response"
										| "tagset"
										| "task"
										| "task_variety"
										| "variety"
										| "annotation_data",
										"survey_id"
									>;
									age_group_name: ExtractColumnType<
										DB & {
											annotation_data: {
												informant_id: number | null;
												annotations: Array<{
													annotation: string | null;
													response: string | null;
													phenomenon: string | null;
													variety: string | null;
												}>;
											};
										},
										| "age_group"
										| "annotation"
										| "annotation_response"
										| "annotation_tagset"
										| "informant"
										| "informant_lives_in_place"
										| "phenomenon"
										| "phenomenon_tagset"
										| "phenomenon_task"
										| "place"
										| "response"
										| "tagset"
										| "task"
										| "task_variety"
										| "variety"
										| "annotation_data",
										"age_group_name"
									>;
									lower_limit: ExtractColumnType<
										DB & {
											annotation_data: {
												informant_id: number | null;
												annotations: Array<{
													annotation: string | null;
													response: string | null;
													phenomenon: string | null;
													variety: string | null;
												}>;
											};
										},
										| "age_group"
										| "annotation"
										| "annotation_response"
										| "annotation_tagset"
										| "informant"
										| "informant_lives_in_place"
										| "phenomenon"
										| "phenomenon_tagset"
										| "phenomenon_task"
										| "place"
										| "response"
										| "tagset"
										| "task"
										| "task_variety"
										| "variety"
										| "annotation_data",
										"lower_limit"
									>;
									upper_limit: ExtractColumnType<
										DB & {
											annotation_data: {
												informant_id: number | null;
												annotations: Array<{
													annotation: string | null;
													response: string | null;
													phenomenon: string | null;
													variety: string | null;
												}>;
											};
										},
										| "age_group"
										| "annotation"
										| "annotation_response"
										| "annotation_tagset"
										| "informant"
										| "informant_lives_in_place"
										| "phenomenon"
										| "phenomenon_tagset"
										| "phenomenon_task"
										| "place"
										| "response"
										| "tagset"
										| "task"
										| "task_variety"
										| "variety"
										| "annotation_data",
										"upper_limit"
									>;
									place_id: number;
									alternate_names: ExtractColumnType<
										DB & {
											annotation_data: {
												informant_id: number | null;
												annotations: Array<{
													annotation: string | null;
													response: string | null;
													phenomenon: string | null;
													variety: string | null;
												}>;
											};
										},
										| "age_group"
										| "annotation"
										| "annotation_response"
										| "annotation_tagset"
										| "informant"
										| "informant_lives_in_place"
										| "phenomenon"
										| "phenomenon_tagset"
										| "phenomenon_task"
										| "place"
										| "response"
										| "tagset"
										| "task"
										| "task_variety"
										| "variety"
										| "annotation_data",
										"alternate_names"
									>;
									geoname_id: ExtractColumnType<
										DB & {
											annotation_data: {
												informant_id: number | null;
												annotations: Array<{
													annotation: string | null;
													response: string | null;
													phenomenon: string | null;
													variety: string | null;
												}>;
											};
										},
										| "age_group"
										| "annotation"
										| "annotation_response"
										| "annotation_tagset"
										| "informant"
										| "informant_lives_in_place"
										| "phenomenon"
										| "phenomenon_tagset"
										| "phenomenon_task"
										| "place"
										| "response"
										| "tagset"
										| "task"
										| "task_variety"
										| "variety"
										| "annotation_data",
										"geoname_id"
									>;
									lat: ExtractColumnType<
										DB & {
											annotation_data: {
												informant_id: number | null;
												annotations: Array<{
													annotation: string | null;
													response: string | null;
													phenomenon: string | null;
													variety: string | null;
												}>;
											};
										},
										| "age_group"
										| "annotation"
										| "annotation_response"
										| "annotation_tagset"
										| "informant"
										| "informant_lives_in_place"
										| "phenomenon"
										| "phenomenon_tagset"
										| "phenomenon_task"
										| "place"
										| "response"
										| "tagset"
										| "task"
										| "task_variety"
										| "variety"
										| "annotation_data",
										"lat"
									>;
									lon: ExtractColumnType<
										DB & {
											annotation_data: {
												informant_id: number | null;
												annotations: Array<{
													annotation: string | null;
													response: string | null;
													phenomenon: string | null;
													variety: string | null;
												}>;
											};
										},
										| "age_group"
										| "annotation"
										| "annotation_response"
										| "annotation_tagset"
										| "informant"
										| "informant_lives_in_place"
										| "phenomenon"
										| "phenomenon_tagset"
										| "phenomenon_task"
										| "place"
										| "response"
										| "tagset"
										| "task"
										| "task_variety"
										| "variety"
										| "annotation_data",
										"lon"
									>;
									place_name: ExtractColumnType<
										DB & {
											annotation_data: {
												informant_id: number | null;
												annotations: Array<{
													annotation: string | null;
													response: string | null;
													phenomenon: string | null;
													variety: string | null;
												}>;
											};
										},
										| "age_group"
										| "annotation"
										| "annotation_response"
										| "annotation_tagset"
										| "informant"
										| "informant_lives_in_place"
										| "phenomenon"
										| "phenomenon_tagset"
										| "phenomenon_task"
										| "place"
										| "response"
										| "tagset"
										| "task"
										| "task_variety"
										| "variety"
										| "annotation_data",
										"place_name"
									>;
									plz: ExtractColumnType<
										DB & {
											annotation_data: {
												informant_id: number | null;
												annotations: Array<{
													annotation: string | null;
													response: string | null;
													phenomenon: string | null;
													variety: string | null;
												}>;
											};
										},
										| "age_group"
										| "annotation"
										| "annotation_response"
										| "annotation_tagset"
										| "informant"
										| "informant_lives_in_place"
										| "phenomenon"
										| "phenomenon_tagset"
										| "phenomenon_task"
										| "place"
										| "response"
										| "tagset"
										| "task"
										| "task_variety"
										| "variety"
										| "annotation_data",
										"plz"
									>;
									shape: ExtractColumnType<
										DB & {
											annotation_data: {
												informant_id: number | null;
												annotations: Array<{
													annotation: string | null;
													response: string | null;
													phenomenon: string | null;
													variety: string | null;
												}>;
											};
										},
										| "age_group"
										| "annotation"
										| "annotation_response"
										| "annotation_tagset"
										| "informant"
										| "informant_lives_in_place"
										| "phenomenon"
										| "phenomenon_tagset"
										| "phenomenon_task"
										| "place"
										| "response"
										| "tagset"
										| "task"
										| "task_variety"
										| "variety"
										| "annotation_data",
										"shape"
									>;
								}>;
								outputFormat: "json";
								status: 200;
						  };
				};
			} & {
				"/responses": {
					$get: {
						input: {
							json: {
								page: number;
								project: string;
								pageSize: number;
								offset: number;
								sortBy: {
									field: string;
									order: string;
								};
								searchTerm: string;
							};
						};
						output: "OK";
						outputFormat: "json";
						status: 201;
					};
				};
			} & {
				"/map": {
					$post: {
						input: {
							json: {
								project: string;
								variants: Array<string>;
								colors: Array<string>;
								version: string;
								question: string;
								registerCategory: string;
								registerDescription: string;
							};
						};
						output: "OK";
						outputFormat: "json";
						status: 201;
					};
				};
			} & {
				"/map/:id": {
					$get: {
						input: {
							param: {
								id: string;
							};
						};
						output: "OK";
						outputFormat: "json";
						status: 201;
					};
				};
			} & {
				"/table/:id": {
					$get:
						| {
								input: {
									param: {
										id: string;
									};
								};
								output: "Provided page number is not a number";
								outputFormat: "json";
								status: 400;
						  }
						| {
								input: {
									param: {
										id: string;
									};
								};
								output: "Provided offset number is not a number";
								outputFormat: "json";
								status: 400;
						  }
						| {
								input: {
									param: {
										id: string;
									};
								};
								output: "Provided pagesize number is not a number";
								outputFormat: "json";
								status: 400;
						  }
						| {
								input: {
									param: {
										id: string;
									};
								};
								output: "Phenomenon id is required";
								outputFormat: "json";
								status: 400;
						  }
						| {
								input: {
									param: {
										id: string;
									};
								};
								output: {
									prev: string | null;
									next: string | null;
									responses: Array<{
										response: string | null;
										annotation: string | null;
										phenomenon: string | null;
										variety: string;
										place: string | null;
										age: string | null;
										informant: string | null;
									}>;
									currentPage: string;
									totalResults: number;
								};
								outputFormat: "json";
								status: 200;
						  };
				};
			} & {
				"/annotation/:project": {
					$get:
						| {
								input: {
									param: {
										project: string;
									};
								};
								output: "Project Id is required";
								outputFormat: "json";
								status: 400;
						  }
						| {
								input: {
									param: {
										project: string;
									};
								};
								output: "Phenomenon is required";
								outputFormat: "json";
								status: 400;
						  }
						| {
								input: {
									param: {
										project: string;
									};
								};
								output: "Project Id is not a number or is negative";
								outputFormat: "json";
								status: 400;
						  }
						| {
								input: {
									param: {
										project: string;
									};
								};
								output: "Phenomenon Id is not a number or is negative";
								outputFormat: "json";
								status: 400;
						  }
						| {
								input: {
									param: {
										project: string;
									};
								};
								output: Array<{
									id: number;
									description: string | null;
									annotation_name: string | null;
								}>;
								outputFormat: "json";
								status: 200;
						  };
				};
			} & {
				"/variety": {
					$get:
						| {
								input: {};
								output: "No varieties found";
								outputFormat: "json";
								status: 404;
						  }
						| {
								input: {};
								output: Array<{
									variety_entry: {
										id: number;
										variety_name: string | null;
										children: Array<{
											id: number | null;
											variety_name: string | null;
											children: never;
										}>;
									};
								}>;
								outputFormat: "json";
								status: 200;
						  };
				};
			},
			"/questions"
	  >
	| hono_types.MergeSchemaPath<
			{
				"/articles/:id": {
					$delete:
						| {
								input: {
									param: {
										id: string;
									};
								};
								output: "Provided id is not a number";
								outputFormat: "json";
								status: 400;
						  }
						| {
								input: {
									param: {
										id: string;
									};
								};
								output: `Article with the ID ${string} has been deleted`;
								outputFormat: "json";
								status: 200;
						  };
				};
			} & {
				"/articles/:id": {
					$put:
						| {
								input: {
									json: {
										alias: string;
										lang: string;
										title: string;
										status: string;
										bibliography?: Array<string> | undefined;
										survey_conducted?: Array<string> | undefined;
										abstract?: string | undefined;
										content?: string | undefined;
										cover?: string | undefined;
										cover_alt?: string | undefined;
										citation?: string | undefined;
										authors?: Array<number> | undefined;
										category?: string | undefined;
										phenomenonId?: number | undefined;
										projectId?: Array<number> | undefined;
									};
								} & {
									param: {
										id: string;
									};
								};
								output: "Provided id is not a number";
								outputFormat: "json";
								status: 400;
						  }
						| {
								input: {
									json: {
										alias: string;
										lang: string;
										title: string;
										status: string;
										bibliography?: Array<string> | undefined;
										survey_conducted?: Array<string> | undefined;
										abstract?: string | undefined;
										content?: string | undefined;
										cover?: string | undefined;
										cover_alt?: string | undefined;
										citation?: string | undefined;
										authors?: Array<number> | undefined;
										category?: string | undefined;
										phenomenonId?: number | undefined;
										projectId?: Array<number> | undefined;
									};
								} & {
									param: {
										id: string;
									};
								};
								output: "No post type found";
								outputFormat: "json";
								status: 400;
						  }
						| {
								input: {
									json: {
										alias: string;
										lang: string;
										title: string;
										status: string;
										bibliography?: Array<string> | undefined;
										survey_conducted?: Array<string> | undefined;
										abstract?: string | undefined;
										content?: string | undefined;
										cover?: string | undefined;
										cover_alt?: string | undefined;
										citation?: string | undefined;
										authors?: Array<number> | undefined;
										category?: string | undefined;
										phenomenonId?: number | undefined;
										projectId?: Array<number> | undefined;
									};
								} & {
									param: {
										id: string;
									};
								};
								output: "Invalid status provided";
								outputFormat: "json";
								status: 400;
						  }
						| {
								input: {
									json: {
										alias: string;
										lang: string;
										title: string;
										status: string;
										bibliography?: Array<string> | undefined;
										survey_conducted?: Array<string> | undefined;
										abstract?: string | undefined;
										content?: string | undefined;
										cover?: string | undefined;
										cover_alt?: string | undefined;
										citation?: string | undefined;
										authors?: Array<number> | undefined;
										category?: string | undefined;
										phenomenonId?: number | undefined;
										projectId?: Array<number> | undefined;
									};
								} & {
									param: {
										id: string;
									};
								};
								output: "Invalid language provided";
								outputFormat: "json";
								status: 400;
						  }
						| {
								input: {
									json: {
										alias: string;
										lang: string;
										title: string;
										status: string;
										bibliography?: Array<string> | undefined;
										survey_conducted?: Array<string> | undefined;
										abstract?: string | undefined;
										content?: string | undefined;
										cover?: string | undefined;
										cover_alt?: string | undefined;
										citation?: string | undefined;
										authors?: Array<number> | undefined;
										category?: string | undefined;
										phenomenonId?: number | undefined;
										projectId?: Array<number> | undefined;
									};
								} & {
									param: {
										id: string;
									};
								};
								output: "Error while fetching data";
								outputFormat: "json";
								status: 500;
						  }
						| {
								input: {
									json: {
										alias: string;
										lang: string;
										title: string;
										status: string;
										bibliography?: Array<string> | undefined;
										survey_conducted?: Array<string> | undefined;
										abstract?: string | undefined;
										content?: string | undefined;
										cover?: string | undefined;
										cover_alt?: string | undefined;
										citation?: string | undefined;
										authors?: Array<number> | undefined;
										category?: string | undefined;
										phenomenonId?: number | undefined;
										projectId?: Array<number> | undefined;
									};
								} & {
									param: {
										id: string;
									};
								};
								output: "Article not found";
								outputFormat: "json";
								status: 404;
						  }
						| {
								input: {
									json: {
										alias: string;
										lang: string;
										title: string;
										status: string;
										bibliography?: Array<string> | undefined;
										survey_conducted?: Array<string> | undefined;
										abstract?: string | undefined;
										content?: string | undefined;
										cover?: string | undefined;
										cover_alt?: string | undefined;
										citation?: string | undefined;
										authors?: Array<number> | undefined;
										category?: string | undefined;
										phenomenonId?: number | undefined;
										projectId?: Array<number> | undefined;
									};
								} & {
									param: {
										id: string;
									};
								};
								output: `Error while updating author, ${string}`;
								outputFormat: "json";
								status: 500;
						  }
						| {
								input: {
									json: {
										alias: string;
										lang: string;
										title: string;
										status: string;
										bibliography?: Array<string> | undefined;
										survey_conducted?: Array<string> | undefined;
										abstract?: string | undefined;
										content?: string | undefined;
										cover?: string | undefined;
										cover_alt?: string | undefined;
										citation?: string | undefined;
										authors?: Array<number> | undefined;
										category?: string | undefined;
										phenomenonId?: number | undefined;
										projectId?: Array<number> | undefined;
									};
								} & {
									param: {
										id: string;
									};
								};
								output: `Error while linking phenomenon, ${string}`;
								outputFormat: "json";
								status: 500;
						  }
						| {
								input: {
									json: {
										alias: string;
										lang: string;
										title: string;
										status: string;
										bibliography?: Array<string> | undefined;
										survey_conducted?: Array<string> | undefined;
										abstract?: string | undefined;
										content?: string | undefined;
										cover?: string | undefined;
										cover_alt?: string | undefined;
										citation?: string | undefined;
										authors?: Array<number> | undefined;
										category?: string | undefined;
										phenomenonId?: number | undefined;
										projectId?: Array<number> | undefined;
									};
								} & {
									param: {
										id: string;
									};
								};
								output: {
									updatedRows: number;
								};
								outputFormat: "json";
								status: 201;
						  };
				};
			} & {
				"/articles/all/:project": {
					$get:
						| {
								input: {
									param: {
										project: string;
									};
								};
								output: "Provided id is not a number";
								outputFormat: "json";
								status: 400;
						  }
						| {
								input: {
									param: {
										project: string;
									};
								};
								output: {
									prev: string | null;
									next: string | null;
									articles: Array<{
										post_id: any;
										title: any;
										alias: any;
										content: any;
										abstract: any;
										status: any;
										post_type: any;
										authors: any;
									}>;
									currentPage: string;
									totalResults: number;
								};
								outputFormat: "json";
								status: 201;
						  };
				};
			} & {
				"/articles/:id": {
					$get:
						| {
								input: {
									param: {
										id: string;
									};
								};
								output: "Provided id is not a number";
								outputFormat: "json";
								status: 400;
						  }
						| {
								input: {
									param: {
										id: string;
									};
								};
								output: "No id provided";
								outputFormat: "json";
								status: 400;
						  }
						| {
								input: {
									param: {
										id: string;
									};
								};
								output: {
									article:
										| {
												abstract: string | null;
												alias: string | null;
												content: string | null;
												cover: string | null;
												cover_alt: string | null;
												created_at: string | null;
												lang: Availablelang | null;
												post_status: Poststatus | null;
												published_at: string | null;
												title: string | null;
												updated_at: string | null;
												citation: string | null;
												post_type_name: string | null;
												post_id: number;
												creator_firstname: string | null;
												creator_lastname: string | null;
												creator_id: number;
												creator_username: string | null;
												creator_email: string;
												phenomenon: Array<{
													phenomenon_id: number | null;
													name: string | null;
												}>;
												bibliography: Array<{
													name: string | null;
												}>;
												authors: Array<{
													id: number | null;
													firstname: string | null;
													lastname: string | null;
													username: string | null;
													email: string | null;
												}>;
										  }
										| undefined;
								};
								outputFormat: "json";
								status: 201;
						  };
				};
			} & {
				"/articles/create": {
					$post:
						| {
								input: {
									json: {
										alias: string;
										lang: string;
										title: string;
										status: string;
										bibliography?: Array<string> | undefined;
										survey_conducted?: Array<string> | undefined;
										abstract?: string | undefined;
										content?: string | undefined;
										cover?: string | undefined;
										cover_alt?: string | undefined;
										citation?: string | undefined;
										authors?: Array<number> | undefined;
										category?: string | undefined;
										phenomenonId?: number | undefined;
										projectId?: Array<number> | undefined;
									};
								};
								output: "No post type found";
								outputFormat: "json";
								status: 400;
						  }
						| {
								input: {
									json: {
										alias: string;
										lang: string;
										title: string;
										status: string;
										bibliography?: Array<string> | undefined;
										survey_conducted?: Array<string> | undefined;
										abstract?: string | undefined;
										content?: string | undefined;
										cover?: string | undefined;
										cover_alt?: string | undefined;
										citation?: string | undefined;
										authors?: Array<number> | undefined;
										category?: string | undefined;
										phenomenonId?: number | undefined;
										projectId?: Array<number> | undefined;
									};
								};
								output: "Invalid status provided";
								outputFormat: "json";
								status: 400;
						  }
						| {
								input: {
									json: {
										alias: string;
										lang: string;
										title: string;
										status: string;
										bibliography?: Array<string> | undefined;
										survey_conducted?: Array<string> | undefined;
										abstract?: string | undefined;
										content?: string | undefined;
										cover?: string | undefined;
										cover_alt?: string | undefined;
										citation?: string | undefined;
										authors?: Array<number> | undefined;
										category?: string | undefined;
										phenomenonId?: number | undefined;
										projectId?: Array<number> | undefined;
									};
								};
								output: "Invalid language provided";
								outputFormat: "json";
								status: 400;
						  }
						| {
								input: {
									json: {
										alias: string;
										lang: string;
										title: string;
										status: string;
										bibliography?: Array<string> | undefined;
										survey_conducted?: Array<string> | undefined;
										abstract?: string | undefined;
										content?: string | undefined;
										cover?: string | undefined;
										cover_alt?: string | undefined;
										citation?: string | undefined;
										authors?: Array<number> | undefined;
										category?: string | undefined;
										phenomenonId?: number | undefined;
										projectId?: Array<number> | undefined;
									};
								};
								output: "Error while fetching data";
								outputFormat: "json";
								status: 500;
						  }
						| {
								input: {
									json: {
										alias: string;
										lang: string;
										title: string;
										status: string;
										bibliography?: Array<string> | undefined;
										survey_conducted?: Array<string> | undefined;
										abstract?: string | undefined;
										content?: string | undefined;
										cover?: string | undefined;
										cover_alt?: string | undefined;
										citation?: string | undefined;
										authors?: Array<number> | undefined;
										category?: string | undefined;
										phenomenonId?: number | undefined;
										projectId?: Array<number> | undefined;
									};
								};
								output: "Article not found";
								outputFormat: "json";
								status: 404;
						  }
						| {
								input: {
									json: {
										alias: string;
										lang: string;
										title: string;
										status: string;
										bibliography?: Array<string> | undefined;
										survey_conducted?: Array<string> | undefined;
										abstract?: string | undefined;
										content?: string | undefined;
										cover?: string | undefined;
										cover_alt?: string | undefined;
										citation?: string | undefined;
										authors?: Array<number> | undefined;
										category?: string | undefined;
										phenomenonId?: number | undefined;
										projectId?: Array<number> | undefined;
									};
								};
								output: `Error while linking phenomenon, ${string}`;
								outputFormat: "json";
								status: 500;
						  }
						| {
								input: {
									json: {
										alias: string;
										lang: string;
										title: string;
										status: string;
										bibliography?: Array<string> | undefined;
										survey_conducted?: Array<string> | undefined;
										abstract?: string | undefined;
										content?: string | undefined;
										cover?: string | undefined;
										cover_alt?: string | undefined;
										citation?: string | undefined;
										authors?: Array<number> | undefined;
										category?: string | undefined;
										phenomenonId?: number | undefined;
										projectId?: Array<number> | undefined;
									};
								};
								output: "Not all authors found";
								outputFormat: "json";
								status: 400;
						  }
						| {
								input: {
									json: {
										alias: string;
										lang: string;
										title: string;
										status: string;
										bibliography?: Array<string> | undefined;
										survey_conducted?: Array<string> | undefined;
										abstract?: string | undefined;
										content?: string | undefined;
										cover?: string | undefined;
										cover_alt?: string | undefined;
										citation?: string | undefined;
										authors?: Array<number> | undefined;
										category?: string | undefined;
										phenomenonId?: number | undefined;
										projectId?: Array<number> | undefined;
									};
								};
								output: "No category provided";
								outputFormat: "json";
								status: 400;
						  }
						| {
								input: {
									json: {
										alias: string;
										lang: string;
										title: string;
										status: string;
										bibliography?: Array<string> | undefined;
										survey_conducted?: Array<string> | undefined;
										abstract?: string | undefined;
										content?: string | undefined;
										cover?: string | undefined;
										cover_alt?: string | undefined;
										citation?: string | undefined;
										authors?: Array<number> | undefined;
										category?: string | undefined;
										phenomenonId?: number | undefined;
										projectId?: Array<number> | undefined;
									};
								};
								output: "Error while creating article";
								outputFormat: "json";
								status: 500;
						  }
						| {
								input: {
									json: {
										alias: string;
										lang: string;
										title: string;
										status: string;
										bibliography?: Array<string> | undefined;
										survey_conducted?: Array<string> | undefined;
										abstract?: string | undefined;
										content?: string | undefined;
										cover?: string | undefined;
										cover_alt?: string | undefined;
										citation?: string | undefined;
										authors?: Array<number> | undefined;
										category?: string | undefined;
										phenomenonId?: number | undefined;
										projectId?: Array<number> | undefined;
									};
								};
								output: {
									articleId: {
										id: number;
									};
								};
								outputFormat: "json";
								status: 201;
						  };
				};
			} & {
				"/articles/create/info": {
					$get: {
						input: {};
						output: {
							authors: Array<{
								id: number;
								value: number;
								firstName: string;
								lastName: string;
							}>;
							categories: Array<{
								id: number;
								name: string | null;
								category: string;
							}>;
							phenomenon: Array<{
								id: number;
								name: string | null;
								category: string;
							}>;
							survey: Array<{
								id: number;
								name: string | null;
								category: string;
							}>;
						};
						outputFormat: "json";
						status: 200;
					};
				};
			},
			"/cms"
	  >
	| hono_types.MergeSchemaPath<
			{
				"/session": {
					$get:
						| {
								input: {};
								output: never;
								outputFormat: "json";
								status: 200;
						  }
						| {
								input: {};
								output: null;
								outputFormat: "json";
								status: 401;
						  };
				};
			} & {
				"/login": {
					$post:
						| {
								input: {
									json: {
										password: string;
										email: string;
									};
								};
								output: "Unauthorized";
								outputFormat: "json";
								status: 401;
						  }
						| {
								input: {
									json: {
										password: string;
										email: string;
									};
								};
								output: {
									email: string;
									id: number;
									firstname: string | null;
									lastname: string | null;
									username: string | null;
									role_name: Userroles | null;
								};
								outputFormat: "json";
								status: 200;
						  };
				};
			} & {
				"/logout": {
					$post:
						| {
								input: {};
								output: "OK";
								outputFormat: "json";
								status: 201;
						  }
						| {
								input: {};
								output: "Unauthorized";
								outputFormat: "json";
								status: 401;
						  };
				};
			} & {
				"/signup": {
					$post:
						| {
								input: {
									json: {
										password: string;
										email: string;
										firstname: string;
										username: string;
										user_role: string;
										lastname?: string | undefined;
									};
								};
								output: never;
								outputFormat: "json";
								status: 200;
						  }
						| {
								input: {
									json: {
										password: string;
										email: string;
										firstname: string;
										username: string;
										user_role: string;
										lastname?: string | undefined;
									};
								};
								output: "This email is not allowed to be used for signup!";
								outputFormat: "json";
								status: 400;
						  }
						| {
								input: {
									json: {
										password: string;
										email: string;
										firstname: string;
										username: string;
										user_role: string;
										lastname?: string | undefined;
									};
								};
								output: "User already exists";
								outputFormat: "json";
								status: 409;
						  };
				};
			},
			"/auth"
	  >
	| hono_types.MergeSchemaPath<
			{
				"/roles/:role": {
					$get:
						| {
								input: {
									param: {
										role: string;
									};
								};
								output: "Invalid role provided";
								outputFormat: "json";
								status: 400;
						  }
						| {
								input: {
									param: {
										role: string;
									};
								};
								output: Array<{
									email: string;
									firstname: ExtractColumnType<
										DB,
										"user_account" | "user_has_role" | "user_roles",
										"firstname"
									>;
									lastname: ExtractColumnType<
										DB,
										"user_account" | "user_has_role" | "user_roles",
										"lastname"
									>;
									username: ExtractColumnType<
										DB,
										"user_account" | "user_has_role" | "user_roles",
										"username"
									>;
									id: number;
									role_name: Userroles | null;
								}>;
								outputFormat: "json";
								status: 200;
						  };
				};
			} & {
				"/roles/:id": {
					$put:
						| {
								input: {
									json: {
										role: Array<string>;
									};
								} & {
									param: {
										id: string;
									};
								};
								output: "Invalid role provided";
								outputFormat: "json";
								status: 400;
						  }
						| {
								input: {
									json: {
										role: Array<string>;
									};
								} & {
									param: {
										id: string;
									};
								};
								output: "Invalid user id provided";
								outputFormat: "json";
								status: 400;
						  }
						| {
								input: {
									json: {
										role: Array<string>;
									};
								} & {
									param: {
										id: string;
									};
								};
								output: "User not found";
								outputFormat: "json";
								status: 404;
						  }
						| {
								input: {
									json: {
										role: Array<string>;
									};
								} & {
									param: {
										id: string;
									};
								};
								output: "Forbidden action";
								outputFormat: "json";
								status: 403;
						  }
						| {
								input: {
									json: {
										role: Array<string>;
									};
								} & {
									param: {
										id: string;
									};
								};
								output: `Roles for user ${string} have been updated`;
								outputFormat: "json";
								status: 200;
						  };
				};
			} & {
				"/data/:id": {
					$put:
						| {
								input: {
									json: {
										email: string;
										firstname: string;
										username: string;
										lastname?: string | undefined;
									};
								} & {
									param: {
										id: string;
									};
								};
								output: "Invalid user id provided";
								outputFormat: "json";
								status: 400;
						  }
						| {
								input: {
									json: {
										email: string;
										firstname: string;
										username: string;
										lastname?: string | undefined;
									};
								} & {
									param: {
										id: string;
									};
								};
								output: "User not found";
								outputFormat: "json";
								status: 404;
						  }
						| {
								input: {
									json: {
										email: string;
										firstname: string;
										username: string;
										lastname?: string | undefined;
									};
								} & {
									param: {
										id: string;
									};
								};
								output: "Forbidden action";
								outputFormat: "json";
								status: 403;
						  }
						| {
								input: {
									json: {
										email: string;
										firstname: string;
										username: string;
										lastname?: string | undefined;
									};
								} & {
									param: {
										id: string;
									};
								};
								output: never;
								outputFormat: "json";
								status: 200;
						  };
				};
			} & {
				"/password/:id": {
					$put:
						| {
								input: {
									json: {
										password: string;
									};
								} & {
									param: {
										id: string;
									};
								};
								output: "Invalid user id provided";
								outputFormat: "json";
								status: 400;
						  }
						| {
								input: {
									json: {
										password: string;
									};
								} & {
									param: {
										id: string;
									};
								};
								output: "User not found";
								outputFormat: "json";
								status: 404;
						  }
						| {
								input: {
									json: {
										password: string;
									};
								} & {
									param: {
										id: string;
									};
								};
								output: "Forbidden action";
								outputFormat: "json";
								status: 403;
						  }
						| {
								input: {
									json: {
										password: string;
									};
								} & {
									param: {
										id: string;
									};
								};
								output: never;
								outputFormat: "json";
								status: 200;
						  };
				};
			} & {
				"/:id": {
					$get:
						| {
								input: {
									param: {
										id: string;
									};
								};
								output: "Invalid user id provided";
								outputFormat: "json";
								status: 400;
						  }
						| {
								input: {
									param: {
										id: string;
									};
								};
								output: "User not found";
								outputFormat: "json";
								status: 404;
						  }
						| {
								input: {
									param: {
										id: string;
									};
								};
								output: {
									email: string;
									firstname: ExtractColumnType<
										DB,
										"user_account" | "user_has_role" | "user_roles",
										"firstname"
									>;
									lastname: ExtractColumnType<
										DB,
										"user_account" | "user_has_role" | "user_roles",
										"lastname"
									>;
									username: ExtractColumnType<
										DB,
										"user_account" | "user_has_role" | "user_roles",
										"username"
									>;
									id: number;
									role_name: Userroles | null;
								};
								outputFormat: "json";
								status: 200;
						  };
				};
			},
			"/user"
	  >
	| hono_types.MergeSchemaPath<hono_types.BlankSchema, "/media">
>;

type AppType = typeof app;

export { app, type AppType };
