ALTER TABLE
	informant
ADD
	column standard_competence TEXT;

ALTER TABLE
	informant
ADD
	column misc TEXT;

ALTER TABLE
	place
ALTER COLUMN
	geoname_id TYPE bigint;