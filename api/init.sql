-- Database is automatically created from POSTGRES_DB environment variable
-- No need to create database manually since PostgreSQL container handles this

DROP TABLE IF EXISTS test;

CREATE TABLE test (
    id SERIAL PRIMARY KEY,
    description TEXT
);

INSERT INTO test (description) VALUES ('bar'), ('baz'), ('qux')