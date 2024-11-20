import type { ColumnType } from "kysely";

export type Availablelang = "de" | "en";

export type Generated<T> =
	T extends ColumnType<infer S, infer I, infer U>
		? ColumnType<S, I | undefined, U>
		: ColumnType<T, T | undefined, T>;

export type Inactivetype = "active" | "inactive";

export type Poststatus = "Draft" | "Published" | "ReadyToPublish" | "Unpublished";

export type Timestamp = ColumnType<Date, Date | string, Date | string>;

export type Userroles = "admin" | "editor" | "superuser";

export interface AgeGroup {
	age_group_name: string | null;
	id: Generated<number>;
	lower_limit: number | null;
	upper_limit: number | null;
}

export interface Analysis {
	created_at: Timestamp | null;
	id: Generated<number>;
	url_long: string | null;
	url_short: string | null;
	user_id: number | null;
}

export interface AnalysisPhenomenon {
	analysis_id: number;
	phenomenon_id: number;
}

export interface Annotation {
	annotation_name: string | null;
	description: string | null;
	id: Generated<number>;
	project_id: number | null;
}

export interface AnnotationInstance {
	annotation_id: number;
	instance_id: number;
}

export interface AnnotationResponse {
	annotation_id: number;
	response_id: number;
}

export interface AnnotationTagset {
	annotation_id: number | null;
	id: Generated<number>;
	tagset_id: number | null;
}

export interface AnnotationToken {
	annotation_id: number;
	token_id: number;
}

export interface Bibliography {
	comment: string | null;
	id: Generated<number>;
	name_bibliography: string | null;
}

export interface BibliographyPhenomenon {
	bibliography_id: number;
	phenomenon_id: number;
}

export interface BibliographyPost {
	bibliography_id: number;
	post_id: number;
}

export interface BibliographySource {
	bibliography_id: number;
	source_id: number;
}

export interface EducationLevel {
	description: string | null;
	education_level_name: string | null;
	id: Generated<number>;
}

export interface Informant {
	age_group_id: number | null;
	comment: string | null;
	education_level_id: number | null;
	gender: string | null;
	id: Generated<number>;
	survey_id: number | null;
}

export interface InformantLivesInPlace {
	informant_id: number;
	place_id: number;
}

export interface Instance {
	comment: string | null;
	id: Generated<number>;
	source_text: string | null;
	user_id: number | null;
}

export interface InstanceSource {
	instance_id: number;
	source_id: number;
}

export interface LingLevelPhenomenon {
	ling_level_id: number;
	phenomenon_id: number;
}

export interface LingLevels {
	description: string | null;
	id: Generated<number>;
	ling_level_name: string | null;
}

export interface Phenomenon {
	description: string | null;
	id: Generated<number>;
	phenomenon_name: string | null;
}

export interface PhenomenonPost {
	phenomenon_id: number;
	post_id: number;
}

export interface PhenomenonTagset {
	phenomenon_id: number;
	tagset_id: number;
}

export interface PhenomenonTask {
	phenomenon_id: number;
	task_id: number;
}

export interface Place {
	alternate_names: string | null;
	geoname_id: number | null;
	id: Generated<number>;
	lat: number | null;
	lon: number | null;
	place_name: string | null;
	plz: number | null;
	shape: string | null;
}

export interface PlaceSource {
	place_id: number;
	source_id: number;
}

export interface PlaceSurveyConducted {
	id: Generated<number>;
	place_id: number | null;
	survey_conducted_id: number | null;
}

export interface Post {
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

export interface PostSource {
	post_id: number;
	source_id: number;
}

export interface PostType {
	description: string | null;
	id: Generated<number>;
	post_type_name: string | null;
}

export interface Project {
	description: string | null;
	duration: string | null;
	id: Generated<number>;
	is_subproject: boolean | null;
	main_project_id: number | null;
	project_name: string | null;
}

export interface ProjectAnalysis {
	analysis_id: number;
	project_id: number;
}

export interface ProjectBibliography {
	bibliography_id: number;
	project_id: number;
}

export interface ProjectPost {
	post_id: number;
	project_id: number;
}

export interface ProjectSource {
	project_id: number;
	source_id: number;
}

export interface ProjectSurvey {
	project_id: number;
	survey_id: number;
}

export interface ProjectTagset {
	project_id: number;
	tagset_id: number;
}

export interface Response {
	id: Generated<number>;
	informant_id: number | null;
	response_influenced: boolean | null;
	response_order: number | null;
	response_selected: boolean | null;
	response_text: string | null;
	task_id: number | null;
	timestamp_audio: string | null;
}

export interface Source {
	bibtex: string | null;
	id: Generated<number>;
	link: string | null;
	source_name: string | null;
}

export interface Survey {
	description: string | null;
	id: Generated<number>;
	source_url: string | null;
	survey_name: string | null;
	survey_period_end: Timestamp | null;
	survey_period_start: Timestamp | null;
	survey_type_id: number | null;
}

export interface SurveyConducted {
	audio_link: string | null;
	comment: string | null;
	conducted_on: Timestamp | null;
	digitization: boolean | null;
	id: Generated<number>;
	instance_id: number | null;
	survey_id: number | null;
}

export interface SurveyContainsTask {
	survey_id: number;
	task_id: number;
}

export interface SurveyContainsVariety {
	survey_id: number;
	variety_id: number;
}

export interface SurveyType {
	description: string | null;
	id: Generated<number>;
	survey_type_name: string | null;
}

export interface Tagset {
	description: string | null;
	id: Generated<number>;
	tagset_name: string | null;
}

export interface Task {
	comment: string | null;
	id: Generated<number>;
	order_stimulus: number | null;
	stimulus_media: string | null;
	stimulus_text: string | null;
	task_name: string | null;
	task_type_id: number | null;
}

export interface TaskType {
	description: string | null;
	id: Generated<number>;
	task_type_name: string | null;
}

export interface TaskVariety {
	task_id: number;
	variety_id: number;
}

export interface Token {
	eye_dialect_transcription: string | null;
	id: Generated<number>;
	informant_id: number | null;
	orthological_transcription: string | null;
	phonetic_transcription: string | null;
	survey_conducted_id: number | null;
}

export interface UserAccount {
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

export interface UserBibliography {
	bibliography_id: number;
	user_id: number;
}

export interface UserHasRole {
	role_id: number;
	user_id: number;
}

export interface UserPost {
	post_id: number;
	user_id: number;
}

export interface UserProject {
	project_id: number;
	user_id: number;
}

export interface UserRoles {
	description: string | null;
	id: Generated<number>;
	role_name: Userroles | null;
}

export interface UserSession {
	created_at: Timestamp | null;
	expires_at: Timestamp | null;
	id: string;
	session_id: string | null;
	user_id: number | null;
}

export interface Variety {
	comment: string | null;
	id: Generated<number>;
	iso_code: string | null;
	variety_id: number | null;
	variety_name: string | null;
}

export interface DB {
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
