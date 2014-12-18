DROP TABLE IF EXISTS questions;
CREATE TABLE questions (
  id MEDIUMINT NOT NULL AUTO_INCREMENT,
  question TEXT NOT NULL,
  choices TEXT,
  correct_answer VARCHAR(64),
  created_at DATETIME,
  modified_at DATETIME,
  PRIMARY KEY(id)
);
