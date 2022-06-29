BEGIN;

-- Beware, setting columns with a default is normally dangerous on large tables!
-- in production you should be more careful doing this.
ALTER TABLE posts ADD COLUMN count bigint DEFAULT 0 CHECK (count >= 0);

COMMIT;
