import { sql } from "slonik";

export async function build() {
  return {
    getSeenByForPost: async (args) => {
      const { db, postId } = args;
      if (!postId) { throw new Error("Post ID not provided!"); }

      const row = await db.maybeOne(sql`SELECT count FROM posts WHERE id = ${postId}`);
      if (!row) {
        throw new Error(`Failed to find post with ID [${postId}]`);
      }

      // This implementation is basic (and wrong) -- we'll never know *who* saw the post
      return { count: row.count, observers: [] };
    },

    recordSeenByForPost: async (args) => {
      const { db, postId, userId } = args;
      if (!postId) { throw new Error("Post ID not provided!"); }
      if (!userId) { throw new Error("Observer ID not provided!"); }

      // Insert or update into the counts table
      const row = await db.one(sql`UPDATE posts SET count=COALESCE(count, 0) + 1 WHERE id = ${postId} RETURNING *`);
      if (!row) {
        throw new Error("failed to update posts and/or return results!");
      }

      return {
        count: row.count,
      };
    },
  };
};
