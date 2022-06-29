import { sql } from "slonik";

const sumNumericStrings = (arr) => {
  return arr
    .map(v => parseInt(v, 10))
    .reduce((acc,v) => acc + v, 0);
};

export async function build() {
  return {
    getSeenByForPost: async (args) => {
      const { db, postId } = args;
      if (!postId) { throw new Error("Post ID not provided!"); }

      const row = await db.maybeOne(sql`SELECT seen_count_hstore::jsonb AS seen_count_hstore_jsonb FROM posts WHERE id = ${postId}`);

      if (!row) {
        throw new Error(`Failed to find post with ID [${postId}]`);
      }

      // Convert all the values to proper numbers
      // We're going to ignore using BigNum for now, and the possibility of doing this *inside* postgres)
      for (const k of Object.keys(row.seen_count_hstore_jsonb)) {
        row.seen_count_hstore_jsonb[k] = parseInt(row.seen_count_hstore_jsonb[k], 10);
      }

      return {
        count: Object.values(row.seen_count_hstore_jsonb).reduce((acc, v) => acc + v, 0),
        users: row.seen_count_hstore_jsonb,
      };
    },

    recordSeenByForPost: async (args) => {
      const { db, postId, userId } = args;
      if (!postId) { throw new Error("Post ID not provided!"); }
      if (!userId) { throw new Error("User ID not provided!"); }

      // Insert or update into the counts table
      const row = await db.maybeOne(sql`
UPDATE posts
SET seen_count_hstore[${userId}] = COALESCE(seen_count_hstore[${userId}]::bigint, 0) + 1
WHERE id = ${postId}
RETURNING avals(seen_count_hstore) AS hstore_values
`);
      if (!row) {
        throw new Error("failed to update posts and/or return results!");
      }

      return {
        count: sumNumericStrings(row.hstore_values)
      };
    },
  };
};
