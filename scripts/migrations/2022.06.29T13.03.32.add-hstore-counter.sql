BEGIN;

CREATE EXTENSION IF NOT EXISTS hstore;

ALTER TABLE posts ADD COLUMN seen_count_hstore hstore NOT NULL DEFAULT ''::hstore;
COMMENT ON COLUMN posts.seen_count_hstore IS 'count of users that have seen the post, with hstore';

COMMIT;
