DROP TABLE IF EXISTS users;
CREATE TABLE users (
  id MEDIUMINT NOT NULL AUTO_INCREMENT,
  username VARCHAR(64) UNIQUE,
  password_hash VARCHAR(64) NOT NULL,
  roles TEXT,
  name VARCHAR(64),
  created_at DATETIME,
  modified_at DATETIME,
  PRIMARY KEY(id)
);
