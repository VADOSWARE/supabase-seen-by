BEGIN;

CREATE EXTENSION IF NOT EXISTS hll;

ALTER TABLE posts ADD COLUMN seen_count_hll hll NOT NULL DEFAULT hll_empty();
COMMENT ON COLUMN posts.seen_count_hll IS 'HyperLogLog storing user IDs';

COMMIT;
