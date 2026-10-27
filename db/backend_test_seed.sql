SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

CREATE SCHEMA IF NOT EXISTS lapis_dev;
ALTER SCHEMA lapis_dev OWNER TO lapis_dev;

SET search_path TO lapis_dev, public;

CREATE TYPE lapis_dev.availablelang AS ENUM ('de', 'en');
CREATE TYPE lapis_dev.inactivetype AS ENUM ('active', 'inactive');
CREATE TYPE lapis_dev.poststatus AS ENUM ('Published', 'Draft', 'ReadyToPublish', 'Unpublished');
CREATE TYPE lapis_dev.userroles AS ENUM ('admin', 'editor', 'superadmin');

CREATE FUNCTION lapis_dev.rand() RETURNS double precision
	LANGUAGE sql
	AS $$
	SELECT random();
$$;

CREATE FUNCTION lapis_dev.substring_index(text, text, integer) RETURNS text
	LANGUAGE sql
	AS $_$
	SELECT array_to_string((string_to_array($1, $2))[1:$3], $2);
$_$;

CREATE TABLE lapis_dev.age_group (
	id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	age_group_name text,
	upper_limit integer,
	lower_limit integer
);

CREATE TABLE lapis_dev.user_account (
	id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	email text NOT NULL UNIQUE,
	firstname text,
	lastname text,
	username text,
	password text NOT NULL,
	project_member boolean,
	association text,
	orcid_id text,
	inactive lapis_dev.inactivetype
);

CREATE TABLE lapis_dev.user_roles (
	id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	role_name lapis_dev.userroles,
	description text
);

CREATE TABLE lapis_dev.user_has_role (
	user_id integer NOT NULL REFERENCES lapis_dev.user_account(id) ON DELETE CASCADE,
	role_id integer NOT NULL REFERENCES lapis_dev.user_roles(id) ON DELETE SET NULL,
	PRIMARY KEY (user_id, role_id)
);

CREATE TABLE lapis_dev.user_session (
	id text PRIMARY KEY,
	session_id text,
	user_id integer REFERENCES lapis_dev.user_account(id) ON DELETE CASCADE,
	created_at timestamp without time zone,
	expires_at timestamp without time zone
);

CREATE TABLE lapis_dev.project (
	id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	project_name text,
	is_subproject boolean,
	description text,
	duration text,
	main_project_id integer REFERENCES lapis_dev.project(id)
);

CREATE TABLE lapis_dev.user_project (
	user_id integer NOT NULL REFERENCES lapis_dev.user_account(id) ON DELETE CASCADE,
	project_id integer NOT NULL REFERENCES lapis_dev.project(id),
	PRIMARY KEY (user_id, project_id)
);

CREATE TABLE lapis_dev.phenomenon (
	id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	phenomenon_name text,
	description text
);

CREATE TABLE lapis_dev.analysis (
	id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	url_short text,
	url_long text,
	created_at timestamp without time zone,
	user_id integer REFERENCES lapis_dev.user_account(id)
);

CREATE TABLE lapis_dev.analysis_phenomenon (
	analysis_id integer NOT NULL REFERENCES lapis_dev.analysis(id),
	phenomenon_id integer NOT NULL REFERENCES lapis_dev.phenomenon(id),
	PRIMARY KEY (analysis_id, phenomenon_id)
);

CREATE TABLE lapis_dev.project_analysis (
	project_id integer NOT NULL REFERENCES lapis_dev.project(id),
	analysis_id integer NOT NULL REFERENCES lapis_dev.analysis(id),
	PRIMARY KEY (project_id, analysis_id)
);

CREATE TABLE lapis_dev.tagset (
	id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	tagset_name text,
	description text
);

CREATE TABLE lapis_dev.phenomenon_tagset (
	phenomenon_id integer NOT NULL REFERENCES lapis_dev.phenomenon(id),
	tagset_id integer NOT NULL REFERENCES lapis_dev.tagset(id),
	PRIMARY KEY (phenomenon_id, tagset_id)
);

CREATE TABLE lapis_dev.project_tagset (
	project_id integer NOT NULL REFERENCES lapis_dev.project(id),
	tagset_id integer NOT NULL REFERENCES lapis_dev.tagset(id),
	PRIMARY KEY (project_id, tagset_id)
);

CREATE TABLE lapis_dev.annotation (
	id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	annotation_name text,
	description text,
	project_id integer REFERENCES lapis_dev.project(id)
);

CREATE TABLE lapis_dev.annotation_tagset (
	id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	annotation_id integer REFERENCES lapis_dev.annotation(id),
	tagset_id integer REFERENCES lapis_dev.tagset(id)
);

CREATE TABLE lapis_dev.bibliography (
	id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	name_bibliography text UNIQUE,
	comment text,
	title text,
	data jsonb DEFAULT '{}'::jsonb
);

CREATE TABLE lapis_dev.bibliography_phenomenon (
	bibliography_id integer NOT NULL REFERENCES lapis_dev.bibliography(id),
	phenomenon_id integer NOT NULL REFERENCES lapis_dev.phenomenon(id),
	PRIMARY KEY (bibliography_id, phenomenon_id)
);

CREATE TABLE lapis_dev.project_bibliography (
	project_id integer NOT NULL REFERENCES lapis_dev.project(id),
	bibliography_id integer NOT NULL REFERENCES lapis_dev.bibliography(id),
	PRIMARY KEY (project_id, bibliography_id)
);

CREATE TABLE lapis_dev.user_bibliography (
	user_id integer NOT NULL REFERENCES lapis_dev.user_account(id) ON DELETE CASCADE,
	bibliography_id integer NOT NULL REFERENCES lapis_dev.bibliography(id) ON DELETE CASCADE,
	PRIMARY KEY (user_id, bibliography_id)
);

CREATE TABLE lapis_dev.source (
	id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	source_name text,
	link text,
	bibtex text
);

CREATE TABLE lapis_dev.bibliography_source (
	bibliography_id integer NOT NULL REFERENCES lapis_dev.bibliography(id) ON DELETE CASCADE,
	source_id integer NOT NULL REFERENCES lapis_dev.source(id),
	PRIMARY KEY (bibliography_id, source_id)
);

CREATE TABLE lapis_dev.project_source (
	project_id integer NOT NULL REFERENCES lapis_dev.project(id),
	source_id integer NOT NULL REFERENCES lapis_dev.source(id),
	PRIMARY KEY (project_id, source_id)
);

CREATE TABLE lapis_dev.education_level (
	id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	education_level_name text,
	description text
);

CREATE TABLE lapis_dev.instance (
	id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	source_text text,
	comment text,
	user_id integer REFERENCES lapis_dev.user_account(id)
);

CREATE TABLE lapis_dev.instance_source (
	instance_id integer NOT NULL REFERENCES lapis_dev.instance(id),
	source_id integer NOT NULL REFERENCES lapis_dev.source(id),
	PRIMARY KEY (instance_id, source_id)
);

CREATE TABLE lapis_dev.annotation_instance (
	annotation_id integer NOT NULL REFERENCES lapis_dev.annotation(id),
	instance_id integer NOT NULL REFERENCES lapis_dev.instance(id),
	PRIMARY KEY (annotation_id, instance_id)
);

CREATE TABLE lapis_dev.survey_type (
	id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	survey_type_name text,
	description text
);

CREATE TABLE lapis_dev.survey (
	id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	survey_name text,
	description text,
	survey_period_start date,
	survey_period_end date,
	source_url text,
	survey_type_id integer REFERENCES lapis_dev.survey_type(id)
);

CREATE TABLE lapis_dev.project_survey (
	project_id integer NOT NULL REFERENCES lapis_dev.project(id),
	survey_id integer NOT NULL REFERENCES lapis_dev.survey(id),
	PRIMARY KEY (project_id, survey_id)
);

CREATE TABLE lapis_dev.survey_conducted (
	id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	conducted_on timestamp without time zone,
	digitization boolean,
	instance_id integer,
	comment text,
	audio_link text,
	survey_id integer REFERENCES lapis_dev.survey(id)
);

CREATE TABLE lapis_dev.informant (
	id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	gender text,
	age_group_id integer REFERENCES lapis_dev.age_group(id),
	survey_id integer REFERENCES lapis_dev.survey_conducted(id),
	education_level_id integer REFERENCES lapis_dev.education_level(id),
	comment text,
	dialect_competence integer,
	standard_competence text,
	misc text
);

CREATE TABLE lapis_dev.place (
	id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	place_name text,
	plz integer,
	lat double precision,
	lon double precision,
	geoname_id bigint,
	shape polygon,
	alternate_names text
);

CREATE TABLE lapis_dev.place_source (
	place_id integer NOT NULL REFERENCES lapis_dev.place(id),
	source_id integer NOT NULL REFERENCES lapis_dev.source(id),
	PRIMARY KEY (place_id, source_id)
);

CREATE TABLE lapis_dev.place_survey_conducted (
	id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	place_id integer REFERENCES lapis_dev.place(id),
	survey_conducted_id integer REFERENCES lapis_dev.survey_conducted(id)
);

CREATE TABLE lapis_dev.informant_lives_in_place (
	informant_id integer NOT NULL REFERENCES lapis_dev.informant(id) ON DELETE CASCADE,
	place_id integer NOT NULL REFERENCES lapis_dev.place(id) ON DELETE SET NULL,
	PRIMARY KEY (informant_id, place_id)
);

CREATE TABLE lapis_dev.informant_survey_conducted (
	informant_id integer NOT NULL REFERENCES lapis_dev.informant(id) ON DELETE CASCADE,
	survey_conducted_id integer NOT NULL REFERENCES lapis_dev.survey_conducted(id) ON DELETE CASCADE,
	PRIMARY KEY (informant_id, survey_conducted_id)
);

CREATE INDEX idx_informant_survey_conducted_informant_id
	ON lapis_dev.informant_survey_conducted USING btree (informant_id);
CREATE INDEX idx_informant_survey_conducted_survey_conducted_id
	ON lapis_dev.informant_survey_conducted USING btree (survey_conducted_id);

CREATE TABLE lapis_dev.ling_levels (
	id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	ling_level_name text,
	description text
);

CREATE TABLE lapis_dev.ling_level_phenomenon (
	ling_level_id integer NOT NULL REFERENCES lapis_dev.ling_levels(id),
	phenomenon_id integer NOT NULL REFERENCES lapis_dev.phenomenon(id),
	PRIMARY KEY (ling_level_id, phenomenon_id)
);

CREATE TABLE lapis_dev.post_type (
	id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	post_type_name text,
	description text
);

CREATE TABLE lapis_dev.post (
	id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	title text,
	alias text,
	cover text,
	content text,
	abstract text,
	created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
	updated_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
	published_at timestamp without time zone,
	citation text,
	cover_alt text,
	creator_id integer REFERENCES lapis_dev.user_account(id),
	post_type_id integer REFERENCES lapis_dev.post_type(id),
	post_status lapis_dev.poststatus,
	lang lapis_dev.availablelang
);

CREATE TABLE lapis_dev.bibliography_post (
	bibliography_id integer NOT NULL REFERENCES lapis_dev.bibliography(id) ON DELETE CASCADE,
	post_id integer NOT NULL REFERENCES lapis_dev.post(id) ON DELETE CASCADE,
	PRIMARY KEY (bibliography_id, post_id)
);

CREATE TABLE lapis_dev.phenomenon_post (
	phenomenon_id integer NOT NULL REFERENCES lapis_dev.phenomenon(id),
	post_id integer NOT NULL REFERENCES lapis_dev.post(id) ON DELETE CASCADE,
	PRIMARY KEY (phenomenon_id, post_id)
);

CREATE TABLE lapis_dev.post_source (
	post_id integer NOT NULL REFERENCES lapis_dev.post(id) ON DELETE CASCADE,
	source_id integer NOT NULL REFERENCES lapis_dev.source(id),
	PRIMARY KEY (post_id, source_id)
);

CREATE TABLE lapis_dev.project_post (
	project_id integer NOT NULL REFERENCES lapis_dev.project(id),
	post_id integer NOT NULL REFERENCES lapis_dev.post(id) ON DELETE CASCADE,
	PRIMARY KEY (project_id, post_id)
);

CREATE TABLE lapis_dev.user_post (
	user_id integer NOT NULL REFERENCES lapis_dev.user_account(id) ON DELETE SET NULL,
	post_id integer NOT NULL REFERENCES lapis_dev.post(id) ON DELETE CASCADE,
	PRIMARY KEY (user_id, post_id)
);

CREATE TABLE lapis_dev.task_type (
	id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	task_type_name text,
	description text
);

CREATE TABLE lapis_dev.task (
	id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	task_name text,
	stimulus_text text,
	stimulus_media text,
	order_stimulus integer,
	comment text,
	task_type_id integer REFERENCES lapis_dev.task_type(id)
);

CREATE TABLE lapis_dev.phenomenon_task (
	phenomenon_id integer NOT NULL REFERENCES lapis_dev.phenomenon(id),
	task_id integer NOT NULL REFERENCES lapis_dev.task(id),
	PRIMARY KEY (phenomenon_id, task_id)
);

CREATE TABLE lapis_dev.survey_contains_task (
	survey_id integer NOT NULL REFERENCES lapis_dev.survey(id),
	task_id integer NOT NULL REFERENCES lapis_dev.task(id),
	PRIMARY KEY (survey_id, task_id)
);

CREATE TABLE lapis_dev.variety (
	id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	variety_name text,
	iso_code text,
	comment text,
	variety_id integer REFERENCES lapis_dev.variety(id)
);

CREATE TABLE lapis_dev.survey_contains_variety (
	survey_id integer NOT NULL REFERENCES lapis_dev.survey(id) ON DELETE CASCADE,
	variety_id integer NOT NULL REFERENCES lapis_dev.variety(id) ON DELETE SET NULL,
	PRIMARY KEY (survey_id, variety_id)
);

CREATE TABLE lapis_dev.task_variety (
	task_id integer NOT NULL REFERENCES lapis_dev.task(id),
	variety_id integer NOT NULL REFERENCES lapis_dev.variety(id),
	PRIMARY KEY (task_id, variety_id)
);

CREATE TABLE lapis_dev.response (
	id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	response_text text,
	timestamp_audio time without time zone,
	response_selected boolean,
	response_order integer,
	response_influenced boolean,
	task_id integer REFERENCES lapis_dev.task(id),
	informant_id integer REFERENCES lapis_dev.informant(id)
);

CREATE TABLE lapis_dev.annotation_response (
	annotation_id integer NOT NULL REFERENCES lapis_dev.annotation(id),
	response_id integer NOT NULL REFERENCES lapis_dev.response(id),
	PRIMARY KEY (annotation_id, response_id)
);

CREATE TABLE lapis_dev.token (
	id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	orthographic_transcription text,
	eye_dialect_transcription text,
	phonetic_transcription text,
	informant_id integer REFERENCES lapis_dev.informant(id),
	survey_conducted_id integer REFERENCES lapis_dev.survey_conducted(id)
);

CREATE TABLE lapis_dev.annotation_token (
	annotation_id integer NOT NULL REFERENCES lapis_dev.annotation(id),
	token_id integer NOT NULL REFERENCES lapis_dev.token(id),
	PRIMARY KEY (annotation_id, token_id)
);

CREATE TABLE lapis_dev.kysely_migration (
	name character varying(255) PRIMARY KEY,
	"timestamp" character varying(255) NOT NULL
);

CREATE TABLE lapis_dev.kysely_migration_lock (
	id character varying(255) PRIMARY KEY,
	is_locked integer DEFAULT 0 NOT NULL
);

CREATE TABLE lapis_dev.migrations (
	id integer GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	migration_name text,
	is_applied boolean,
	applied_on timestamp without time zone
);

-- Seed reference data and test accounts
INSERT INTO lapis_dev.user_roles (id, role_name, description) OVERRIDING SYSTEM VALUE VALUES
	(1, 'admin', 'Administrator'),
	(2, 'editor', 'Editor'),
	(3, 'superadmin', 'Superadmin');

INSERT INTO lapis_dev.user_account (id, email, firstname, lastname, username, password, inactive) OVERRIDING SYSTEM VALUE VALUES
	(1, 'admin@oeaw.ac.at', 'Admin', 'Account', 'admin', '$argon2id$v=19$m=19456,t=2,p=1$TiOJllQwDFmGfCCZPzStVA$IzWarzKFhOWfMapHIwmqm8+IXtlhukfcnZbh2sBXewY', 'active'),
	(2, 'editor@oeaw.ac.at', 'Editor', 'Account', 'editor', '$argon2id$v=19$m=19456,t=2,p=1$Ogqc9+w6Zg5yBxl2DPySyg$h9Q152M7XatdjqJU1FISUT0sB/Z+4JFX2qTmaYrTXkY', 'active'),
	(3, 'max.mustermann@oeaw.ac.at', 'Max', 'Mustermann', 'mmustermann', '$argon2id$v=19$m=19456,t=2,p=1$xROMq/ogtT3f4twt4JsbKg$C9FowTqX2JdTSHSMQLxS5TPAQKYwaBBYVnrPWdo1ez8', 'active'),
	(14, 'author14@oeaw.ac.at', 'Author', 'Fourteen', 'author14', '$argon2id$v=19$m=19456,t=2,p=1$xROMq/ogtT3f4twt4JsbKg$C9FowTqX2JdTSHSMQLxS5TPAQKYwaBBYVnrPWdo1ez8', 'active'),
	(151, 'author151@oeaw.ac.at', 'Author', 'OneFiftyOne', 'author151', '$argon2id$v=19$m=19456,t=2,p=1$xROMq/ogtT3f4twt4JsbKg$C9FowTqX2JdTSHSMQLxS5TPAQKYwaBBYVnrPWdo1ez8', 'active'),
	(391, 'author391@oeaw.ac.at', 'Author', 'ThreeNinetyOne', 'author391', '$argon2id$v=19$m=19456,t=2,p=1$xROMq/ogtT3f4twt4JsbKg$C9FowTqX2JdTSHSMQLxS5TPAQKYwaBBYVnrPWdo1ez8', 'active'),
	(392, 'author392@oeaw.ac.at', 'Author', 'ThreeNinetyTwo', 'author392', '$argon2id$v=19$m=19456,t=2,p=1$xROMq/ogtT3f4twt4JsbKg$C9FowTqX2JdTSHSMQLxS5TPAQKYwaBBYVnrPWdo1ez8', 'active');

INSERT INTO lapis_dev.user_has_role (user_id, role_id) VALUES
	(1, 1),
	(2, 2),
	(3, 3);

INSERT INTO lapis_dev.post_type (id, post_type_name, description) OVERRIDING SYSTEM VALUE VALUES
	(1, 'commentary', NULL),
	(2, 'methodology', NULL),
	(3, 'project_description', NULL),
	(4, 'short_description', NULL);

INSERT INTO lapis_dev.project (id, project_name, is_subproject, description, duration, main_project_id) OVERRIDING SYSTEM VALUE VALUES
	(1, 'LexAT', NULL, NULL, NULL, NULL),
	(2, 'DiÖ', false, NULL, NULL, NULL),
	(3, 'PP02', true, NULL, NULL, 2),
	(4, 'PP03', true, NULL, NULL, 2),
	(5, 'PP04', true, NULL, NULL, 2);

INSERT INTO lapis_dev.survey_type (id, survey_type_name, description) OVERRIDING SYSTEM VALUE VALUES
	(1, 'Online Fragebogen', NULL),
	(2, 'Freundesgespräch', NULL),
	(3, 'Interview', NULL),
	(4, 'Vorlesen', NULL),
	(5, 'Gespräch ohne Explorator/in', NULL);

INSERT INTO lapis_dev.survey (id, survey_name, description, survey_period_start, survey_period_end, source_url, survey_type_id) OVERRIDING SYSTEM VALUE VALUES
	(1, 'LexAT Runde Ⅰ', NULL, '2021-07-01', '2023-03-01', NULL, 1),
	(2, 'LexAT Runde II', NULL, '2024-08-01', '2025-08-01', NULL, 1),
	(3, 'DiÖ Freundesgespräche', NULL, NULL, NULL, NULL, 2),
	(4, 'Interview_PP0308', NULL, NULL, NULL, NULL, 3);

INSERT INTO lapis_dev.project_survey (project_id, survey_id) VALUES
	(1, 1),
	(1, 2),
	(2, 3),
	(2, 4),
	(4, 4);

INSERT INTO lapis_dev.instance (id, source_text, comment, user_id) OVERRIDING SYSTEM VALUE VALUES
	(1, NULL, '0030_NECK_alt_f_INT', 1),
	(2, NULL, '0031_WIEN_jung_f_INT', 1),
	(3, NULL, '0032_GRAZ_alt_m_INT', 1);

INSERT INTO lapis_dev.survey_conducted (id, conducted_on, digitization, instance_id, comment, audio_link, survey_id) OVERRIDING SYSTEM VALUE VALUES
	(1, '2022-01-15 10:00:00', true, 1, '0030_NECK_alt_f_INT', 'interviews', 4),
	(2, '2022-02-20 14:00:00', true, 2, '0031_WIEN_jung_f_INT', 'interviews', 1),
	(3, '2024-09-10 09:00:00', true, 3, '0032_GRAZ_alt_m_INT', 'interviews', 2);

INSERT INTO lapis_dev.tagset (id, tagset_name, description) OVERRIDING SYSTEM VALUE VALUES
	(1, 'KEHREN', NULL),
	(2, 'FERKEL', NULL),
	(4, 'GIEßKANNE', NULL),
	(5, 'OMA', NULL),
	(10, 'KNÖCHEL', NULL),
	(11, 'AUGENLID', NULL);

INSERT INTO lapis_dev.project_tagset (project_id, tagset_id) VALUES
	(1, 1),
	(1, 2),
	(1, 4),
	(1, 5),
	(1, 10),
	(1, 11);

INSERT INTO lapis_dev.phenomenon (id, phenomenon_name, description) OVERRIDING SYSTEM VALUE VALUES
	(2, 'FERKEL/SCHWEIN/SAU', NULL),
	(4, 'GIESSKANNE/SPRITZKRUG/KANNE', NULL),
	(5, 'OMA/GROSSMUTTER', NULL),
	(10, 'KNÖCHEL/ENKEL', NULL),
	(11, 'AUGENLID/LID', NULL);

INSERT INTO lapis_dev.phenomenon_tagset (phenomenon_id, tagset_id) VALUES
	(2, 2),
	(4, 4),
	(5, 5),
	(10, 10),
	(11, 11);

INSERT INTO lapis_dev.age_group (id, age_group_name, upper_limit, lower_limit) OVERRIDING SYSTEM VALUE VALUES
	(6, '25-29', 29, 25),
	(14, '65-69', 69, 65);

INSERT INTO lapis_dev.place (id, place_name, plz, lat, lon, geoname_id) OVERRIDING SYSTEM VALUE VALUES
	(1, 'Wien', 1010, 48.20849, 16.37208, 2761369),
	(2, 'Neckenmarkt', 7311, 47.599776, 16.5483316, 2770993);

INSERT INTO lapis_dev.place_survey_conducted (id, place_id, survey_conducted_id) OVERRIDING SYSTEM VALUE VALUES
	(1, 2, 1),
	(2, 1, 2);

INSERT INTO lapis_dev.informant (id, gender, age_group_id, survey_id, comment, dialect_competence, standard_competence) OVERRIDING SYSTEM VALUE VALUES
	(1, 'weiblich', 6, 2, 'Informant 1', 4, '5');

INSERT INTO lapis_dev.informant_lives_in_place (informant_id, place_id) VALUES
	(1, 1);

INSERT INTO lapis_dev.informant_survey_conducted (informant_id, survey_conducted_id) VALUES
	(1, 2);

INSERT INTO lapis_dev.variety (id, variety_name, iso_code, comment, variety_id) OVERRIDING SYSTEM VALUE VALUES
	(1, 'Standardsprachliche Register', NULL, NULL, NULL),
	(2, 'Standardfernere Register', NULL, NULL, NULL),
	(7, 'Dialekt (Mundart)', NULL, NULL, 2);

INSERT INTO lapis_dev.task_type (id, task_type_name, description) OVERRIDING SYSTEM VALUE VALUES
	(1, 'Übersetzung', NULL);

INSERT INTO lapis_dev.task (id, task_name, stimulus_text, stimulus_media, order_stimulus, comment, task_type_id) OVERRIDING SYSTEM VALUE VALUES
	(1, 'Knöchel', 'Knöchel', NULL, 1, NULL, 1),
	(2, 'Augenlid', 'Augenlid', NULL, 2, NULL, 1);

INSERT INTO lapis_dev.phenomenon_task (phenomenon_id, task_id) VALUES
	(10, 1),
	(11, 2);

INSERT INTO lapis_dev.survey_contains_task (survey_id, task_id) VALUES
	(1, 1),
	(1, 2);

INSERT INTO lapis_dev.task_variety (task_id, variety_id) VALUES
	(1, 7),
	(2, 7);

INSERT INTO lapis_dev.annotation (id, annotation_name, description, project_id) OVERRIDING SYSTEM VALUE VALUES
	(1, 'Enkel', NULL, 1);

INSERT INTO lapis_dev.response (id, response_text, response_selected, response_order, response_influenced, task_id, informant_id) OVERRIDING SYSTEM VALUE VALUES
	(1, 'Enkel', true, 1, false, 1, 1);

INSERT INTO lapis_dev.annotation_response (annotation_id, response_id) VALUES
	(1, 1);

INSERT INTO lapis_dev.bibliography (id, name_bibliography, title, data) OVERRIDING SYSTEM VALUE VALUES
	(1, 'SEED_BIB_1', 'Seed Bibliography 1', '{"itemType": "book"}'::jsonb),
	(2, 'SEED_BIB_2', 'Seed Bibliography 2', '{"itemType": "journalArticle"}'::jsonb);

INSERT INTO lapis_dev.kysely_migration (name, "timestamp") VALUES
	('20260318131642_add_dialect_competence.sql', '2026-03-24T12:00:00.000Z'),
	('20260324144109_add_bib_columns.sql', '2026-04-01T12:00:00.000Z'),
	('20260812132045_add_junction_informant_survey_conducted.sql', '2026-09-01T12:00:00.000Z'),
	('20260812132203_alter_table_informant.sql', '2026-09-01T12:00:00.000Z');

SELECT pg_catalog.setval('lapis_dev.age_group_id_seq', 20, true);
SELECT pg_catalog.setval('lapis_dev.annotation_id_seq', 10, true);
SELECT pg_catalog.setval('lapis_dev.bibliography_id_seq', 10, true);
SELECT pg_catalog.setval('lapis_dev.informant_id_seq', 10, true);
SELECT pg_catalog.setval('lapis_dev.instance_id_seq', 10, true);
SELECT pg_catalog.setval('lapis_dev.phenomenon_id_seq', 20, true);
SELECT pg_catalog.setval('lapis_dev.place_id_seq', 10, true);
SELECT pg_catalog.setval('lapis_dev.place_survey_conducted_id_seq', 10, true);
SELECT pg_catalog.setval('lapis_dev.post_id_seq', 10, true);
SELECT pg_catalog.setval('lapis_dev.post_type_id_seq', 10, true);
SELECT pg_catalog.setval('lapis_dev.project_id_seq', 10, true);
SELECT pg_catalog.setval('lapis_dev.response_id_seq', 10, true);
SELECT pg_catalog.setval('lapis_dev.survey_conducted_id_seq', 10, true);
SELECT pg_catalog.setval('lapis_dev.survey_id_seq', 10, true);
SELECT pg_catalog.setval('lapis_dev.survey_type_id_seq', 10, true);
SELECT pg_catalog.setval('lapis_dev.tagset_id_seq', 20, true);
SELECT pg_catalog.setval('lapis_dev.task_id_seq', 10, true);
SELECT pg_catalog.setval('lapis_dev.task_type_id_seq', 10, true);
SELECT pg_catalog.setval('lapis_dev.user_account_id_seq', 500, true);
SELECT pg_catalog.setval('lapis_dev.user_roles_id_seq', 3, true);
SELECT pg_catalog.setval('lapis_dev.variety_id_seq', 10, true);
