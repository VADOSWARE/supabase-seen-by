import { sql } from "slonik";

export async function build() {
  return {
    getSeenByUsersForPost: async (args) => {
      // This implementation is basic, fast, and wrong -- we'll never know *who* saw the post
      return { users: {} };
    },

    getSeenByCountForPost: async (args) => {
      const { db, postId } = args;
      if (!postId) { throw new Error("Post ID not provided!"); }

      let count = await db.maybeOneFirst(sql`SELECT seen_count FROM posts WHERE id = ${postId}`);
      count = count ?? 0;

      return { count };
    },

    recordSeenByForPost: async (args) => {
      const { db, postId, userId } = args;
      if (!postId) { throw new Error("Post ID not provided!"); }
      if (!userId) { throw new Error("User ID not provided!"); }

      // Insert or update into the counts table
      const row = await db.one(sql`UPDATE posts SET seen_count=COALESCE(seen_count, 0) + 1 WHERE id = ${postId} RETURNING *`);
      if (!row) {
        throw new Error("failed to update posts and/or return results!");
      }

      return {
        count: row.seen_count,
      };
    },
  };
};
