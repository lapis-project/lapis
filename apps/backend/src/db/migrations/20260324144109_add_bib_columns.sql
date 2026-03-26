ALTER TABLE
	IF EXISTS bibliography
ADD
	COLUMN title TEXT,
ADD
	COLUMN data JSONB DEFAULT '{}';

ALTER TABLE
	bibliography
ADD
	CONSTRAINT unique_bib_name UNIQUE (name_bibliography);