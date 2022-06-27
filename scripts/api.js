import * as process from "process";
import * as path from "path";

import esMain from "es-main";
import esDirname from "es-dirname";

import fastify from "fastify";
import { createPool } from "slonik";

const DEFAULT_PORT = 5000;

/**
 * Set up the DB connection
 *
 * @returns {slonik.Pool} Slonik connection pool for performing queries
 */
export async function setupDB(args) {
  const logger = args.logger;
  const dbURL = args.dbURL;
  if (!dbURL) { throw new Error("DB_URL is not configured"); }

  // Build the pool
  const pool = await createPool(dbURL);

  const skipMigrations = !!args.skipMigrations ?? false;
  if (skipMigrations) { return pool; }

  // Perform DB migrations
  const migrationsPath = path.resolve(path.join(esDirname, "migrations"));
  logger?.info(`reading migrations @ [${migrationsPath}]`);

  // Build the migration object
  const migrator = new SlonikMigrator({
    migrationsPath,
    slonik: pool,
  });

  // Perform migrations
  await migrator.up();

  return pool;
}

/**
 * Strategy for running seen by operations
 *
 * This class defines both where migrations can be found and how to perform individual operations,
 * given an existing slonik connection pool.
 *
 * @class SeenByStrategy
 */
export class SeenByStrategy {
  constructor(args) {
    if (!args) { throw new TypeError("SeenByStrategy must be constructed with args"); }

    this.migrationDirAbsPath = args.migrationDirAbsPath;

    this.getSeenByForEntity = args.getSeenByForEntity;
    this.recordSeenByForEntity = args.recordSeenByForEntity;
  }
}

// Enum of strategies to use
const SEEN_BY_STRATEGY_NAME = {
  SimpleCounter: "simple-counter",
  SimpleUserStorage: "simple-user-storage",
  HLL: "hll",
};

/**
 * Load pluggable seenBy Strategy information
 *
 * @returns SeenByStrategy
 */
async function loadSeenByStrategy(args) {
  const logger = args.logger;

  // Retrieve strategy
  const strategy = args.strategy;
  if (!strategy) { throw new TypeError(`Missing/invalid strategy [${args.strategy}]`); }

  // Ensure strategy is valid
  if (!Object.values(SEEN_BY_STRATEGY_NAME).contains(strategy)) {
    throw new Error(`Invalid/unrecognized seen by strategy [${strategy}]`);
  }

  // Use hardcoded path to strategy JS (strategy file must be named properly)
  const defaultPath = path.join(esDirname, "strategies");
  const strategyJSPath = path.resolve(
    args.strategyJSDir ?? process.env.SEEN_BY_STRATEGY_JS_DIR ?? defaultPath,
    strategy,
  );
  logger?.info(`loading strategy JS files from directory [${strategyJSPath}]...`);

  // Attempt to load the JS for a given strategy
  try {
    const seenByStrategyImport = await import("./strategies/${seenByStrategy}");
    return new SeenByStrategy(seenByStrategyImport.default);
  } catch (err) {
    logger?.error({ err }, "failed to import seen by strategy JS");
    throw new Error(`Failed to import seen by strategy from file @ [${strategyPath}]`);
  }
}

/**
 * Build the example applciation
 *
 * @returns The fastify application that was built
*/
export async function buildApp() {
  // Set up the application
  const app = fastify({ logger: true });

  // Build the seen by strategy
  const seenByStrategy = await loadSeenByStrategy({
    logger: app.log,
    strategy: process.env.SEEN_BY_STRATEGY,
  });

  // Set up the database
  const db = await setupDB({
    logger: app.log,
    dbURL: process.env.DB_URL,
    seenByStrategy,
  });

  // Retrieve the count and/or who has seen a given post
  app.get('/post/:postId/seen-by', async (req, res) => {
    const postId = req.params.postId;
    req.log.info(`handling noitifications fetch for post with ID [${postId}]`);

    // Retrieve how many times (+/- by whom) an entity has been seen
    const seenBy = await seenByStrategy.getSeenByForEntity({
      entityType: 'post',
      entityId: postId,
    });

    return seenBy;
  });

  // Record that a given post was seen
  app.post('/post/:postId/seen-by', async (req, res) => {
    const postId = req.params.postId;
    const userId = req.headers.get["X-USER-ID"];
    req.log.info(`adding notification for post [${postId}] by user [${userId}]`);

    // Record that the entity (in this case a post) has been seen
    await seenByStrategy.recordSeenByForEntity({
      entityType: 'post',
      entityId: postId,
      userId: userId,
    });

    return { ok: true };
  });

  // Add notification for a given post
  app.post('/post/:postId/seen-by', async (req, res) => {
    const postId = req.params.postId;
    const userId = req.headers.get["X-USER-ID"];
    req.log.info(`adding notification for post [${postId}] by user [${userId}]`);
  });

  return app;
}

// Main application
const main = async () => {
  let app;
  try {
    app = await buildApp();

    await app.listen({
      port: parseInt(process.env.PORT ?? `${DEFAULT_PORT}`, 10),
    });

  } catch (err) {
    if (app) {
      app.log.error(err);
    } else {
      console.log("ERROR", err);
    }
    process.exit(1);
  }
};

// Run the application
if (esMain(import.meta)) { main(); }
