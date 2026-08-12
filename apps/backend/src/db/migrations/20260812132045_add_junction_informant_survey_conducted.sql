CREATE TABLE informant_survey_conducted (
	informant_id INTEGER NOT NULL,
	survey_conducted_id INTEGER NOT NULL,
	PRIMARY KEY (informant_id, survey_conducted_id),
	CONSTRAINT fk_informant_survey_conducted_informant FOREIGN KEY (informant_id) REFERENCES informant(id) ON DELETE CASCADE,
	CONSTRAINT fk_informant_survey_conducted_survey_conducted FOREIGN KEY (survey_conducted_id) REFERENCES survey_conducted(id) ON DELETE CASCADE
);

-- Create indexes for better query performance
CREATE INDEX idx_informant_survey_conducted_informant_id ON informant_survey_conducted(informant_id);

CREATE INDEX idx_informant_survey_conducted_survey_conducted_id ON informant_survey_conducted(survey_conducted_id);