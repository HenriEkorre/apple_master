DROP TABLE IF EXISTS reviews CASCADE;
DROP TABLE IF EXISTS list_movies CASCADE;
DROP TABLE IF EXISTS lists CASCADE;
DROP TABLE IF EXISTS group_members CASCADE;
DROP TABLE IF EXISTS groups CASCADE;
DROP TABLE IF EXISTS users CASCADE;

DROP TYPE IF EXISTS group_type_enum CASCADE;
DROP TYPE IF EXISTS group_role_enum CASCADE;
DROP TYPE IF EXISTS member_status_enum CASCADE;
DROP TYPE IF EXISTS owner_type_enum CASCADE;
DROP TYPE IF EXISTS visibility_type_enum CASCADE;

CREATE TYPE group_type_enum AS ENUM ('public', 'closed');
CREATE TYPE group_role_enum AS ENUM ('admin', 'member');
CREATE TYPE member_status_enum AS ENUM ('active', 'pending');
CREATE TYPE owner_type_enum AS ENUM ('user', 'group');
CREATE TYPE visibility_type_enum AS ENUM ('private', 'group', 'public');

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) NOT NULL UNIQUE,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    two_factor_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE groups (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    type group_type_enum NOT NULL,
    creator_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE group_members (
    id SERIAL PRIMARY KEY,
    group_id INTEGER NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role group_role_enum NOT NULL DEFAULT 'member',
    status member_status_enum NOT NULL DEFAULT 'pending',
    CONSTRAINT uk_group_user UNIQUE (group_id, user_id)
);

CREATE TABLE lists (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    owner_type owner_type_enum NOT NULL,
    owner_id INTEGER NOT NULL,
    is_public_link BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE list_movies (
    id SERIAL PRIMARY KEY,
    list_id INTEGER NOT NULL REFERENCES lists(id) ON DELETE CASCADE,
    tmdb_movie_id INTEGER NOT NULL,
    added_by INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    added_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_list_movie UNIQUE (list_id, tmdb_movie_id)
);

CREATE TABLE reviews (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tmdb_movie_id INTEGER NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    visibility visibility_type_enum NOT NULL DEFAULT 'public',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uk_user_movie_review UNIQUE (user_id, tmdb_movie_id)
);

CREATE INDEX idx_groups_creator_id ON groups(creator_id);
CREATE INDEX idx_group_members_group_id ON group_members(group_id);
CREATE INDEX idx_group_members_user_id ON group_members(user_id);
CREATE INDEX idx_lists_owner ON lists(owner_type, owner_id);
CREATE INDEX idx_list_movies_list_id ON list_movies(list_id);
CREATE INDEX idx_list_movies_added_by ON list_movies(added_by);
CREATE INDEX idx_reviews_user_id ON reviews(user_id);
CREATE INDEX idx_reviews_tmdb_movie_id ON reviews(tmdb_movie_id);