DROP TABLE IF EXISTS answers;
CREATE TABLE answers (
  question_id MEDIUMINT NOT NULL,
  user_id MEDIUMINT NOT NULL,
  answer VARCHAR(64),
  created_at DATETIME,
  PRIMARY KEY(question_id, user_id)
);
