BEGIN;

CREATE TABLE posts_seen_by_users (
  post_id bigint REFERENCES posts(id),
  user_id bigint REFERENCES users(id),
  seen_count bigint NOT NULL DEFAULT 0 CHECK (seen_count > 0),

  PRIMARY KEY (post_id, user_id)
);

COMMIT;
