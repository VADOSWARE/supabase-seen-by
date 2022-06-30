import { sql } from "slonik";

const sumNumericStrings = (arr) => {
  return arr
    .map(v => parseInt(v, 10))
    .reduce((acc,v) => acc + v, 0);
};

export async function build() {
  return {
    getSeenByUsersForPost: async (args) => {
      const { db, postId } = args;
      if (!postId) { throw new Error("Post ID not provided!"); }

      const { rows } = db.query(sql`SELECT * FROM posts_seen_by_users WHERE post_id = ${postId}`);
      if (!rows) { return { users: {} }; }

      return {
        users: Object.fromEntries(rows.map(r => [r.user_id, r.seen_count])),
      };
    },

    getSeenByCountForPost: async (args) => {
      const { db, postId } = args;
      if (!postId) { throw new Error("Post ID not provided!"); }

      let count = await db.maybeOneFirst(sql`SELECT SUM(seen_count) FROM posts_seen_by_users WHERE post_id = ${postId}`);
      count = count ?? 0;

      return { count };
    },

    recordSeenByForPost: async (args) => {
      const { db, postId, userId } = args;
      if (!postId) { throw new Error("Post ID not provided!"); }
      if (!userId) { throw new Error("User ID not provided!"); }

      // Insert or update into the counts table
      let row;
      row = await db.maybeOne(sql`
INSERT INTO posts_seen_by_users
  (user_id, post_id, seen_count)
VALUES
  (${userId}, ${postId}, 1)
ON CONFLICT (post_id, user_id)
DO UPDATE
  SET seen_count = posts_seen_by_users.seen_count + 1 WHERE posts_seen_by_users.post_id = ${postId}
RETURNING *
`);
      if (!row) { throw new Error("failed to update posts and/or return results!"); }

      // Retreive summed seen count
      row = await db.maybeOne(sql`SELECT SUM(seen_count) as seen_count FROM posts_seen_by_users WHERE post_id = ${postId}`);
      if (!row) { throw new Error("failed to retrieve summed seen_count"); }

      return {
        count: row.seen_count,
      };
    },
  };
};
