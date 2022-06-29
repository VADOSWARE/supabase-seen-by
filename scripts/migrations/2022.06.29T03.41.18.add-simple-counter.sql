BEGIN;

-- Beware, setting columns with a default is normally dangerous on large tables!
-- in production you should be more careful doing this.
ALTER TABLE posts ADD COLUMN seen_count bigint DEFAULT 0 CHECK (seen_count >= 0);

COMMIT;
