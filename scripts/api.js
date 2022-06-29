import * as process from "process";

import fastify from "fastify";
import { createPool } from "slonik";
import { SlonikMigrator } from "@slonik/migrator";

import { setupDB } from "./db.js";
import { setupSeenByStrategy } from "./strategy.js";

/**
 * Build the example API application
 *
 * @returns The fastify application that was built
 */
export async function buildAPI(args) {
  // Set up the application
  const app = fastify({
    disableRequestLogging: typeof args?.logRequests === "boolean" ? args.logRequests : true,
    logger: {
      level: args?.logLevel ?? process.env.LOG_LEVEL ?? "info",
    },
  });

  // Build the seen by strategy
  const seenByStrategy = await setupSeenByStrategy({
    logger: app.log,
    strategy: process.env.SEEN_BY_STRATEGY,
  });

  // Set up the database
  const db = await setupDB({
    logger: app.log,
    dbURL: process.env.DB_URL,
    seenByStrategy,
  });
  app.db = db; // Save the DB to the application

  // Retrieve the count and/or who has seen a given post
  app.get('/posts/:postId/seen-by', async (req, res) => {
    const postId = req.params.postId;
    req.log.debug(`handling noitifications fetch for post with ID [${postId}]`);

    // Retrieve how many times (+/- by whom) an post has been seen
    const seenBy = await seenByStrategy.getSeenByForPost({
      db,
      postId: postId,
    });

    return seenBy;
  });

  // Record that a given post was seen
  app.post('/posts/:postId/seen-by/:userId', async (req, res) => {
    const postId = req.params.postId;
    const userId = req.params.userId;
    req.log.debug(`adding notification for post [${postId}] by user [${userId}]`);

    // Record that the post (in this case a post) has been seen
    await seenByStrategy.recordSeenByForPost({
      db,
      postId: postId,
      userId: userId,
    });

    return { ok: true };
  });

  return app;
}
