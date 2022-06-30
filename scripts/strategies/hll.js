import { sql } from "slonik";

export async function build() {
  return {
    getSeenByUsersForPost: async (args) => {
      const { db, postId } = args;
      if (!postId) { throw new Error("Post ID not provided!"); }

      const { rows } = db.query(sql`SELECT * FROM posts_seen_by_users WHERE post_id = ${postId}`);
      if (!rows) { return { users: {} }; }

      return {
        users: Object.fromEntries(rows.map(r => [ r.user_id, r.seen_count ])),
      };
    },

    getSeenByCountForPost: async (args) => {
      const { db, postId } = args;
      if (!postId) { throw new Error("Post ID not provided!"); }

      let count = await db.maybeOneFirst(sql`SELECT hll_cardinality(seen_count_hll) FROM posts WHERE id = ${postId}`);
      count = count ?? 0;

      return { count };
    },

    recordSeenByForPost: async (args) => {
      const { db, postId, userId } = args;
      if (!postId) { throw new Error("Post ID not provided!"); }
      if (!userId) { throw new Error("User ID not provided!"); }

      // Insert/update into post seen by users, update HLL
      const count = await db.oneFirst(sql`
WITH upsert AS (
  INSERT INTO posts_seen_by_users
    (post_id, user_id, seen_count)
  VALUES
    (${postId}, ${userId}, 1)
  ON CONFLICT (post_id, user_id)
    DO UPDATE
    SET seen_count = posts_seen_by_users.seen_count + 1 WHERE posts_seen_by_users.post_id = ${postId}
)
  UPDATE posts
  SET seen_count_hll = hll_add(seen_count_hll, hll_hash_integer(${userId}))
  WHERE id = ${postId}
  RETURNING hll_cardinality(seen_count_hll)
`);
      // // Retreive summed seen count
      // count = await db.oneFirst(sql`SELECT hll_cardinality(seen_count_hll) FROM posts WHERE post_id = ${postId}`);

      return { count };
    },
  };
};
