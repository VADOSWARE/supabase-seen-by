BEGIN;

ALTER TABLE posts DROP COLUMN seen_count_hstore;

DROP EXTENSION IF EXISTS hstore;

COMMIT;