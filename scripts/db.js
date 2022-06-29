import * as path from "path";

import esDirname from "es-dirname";

import { createPool } from "slonik";
import { SlonikMigrator } from "@slonik/migrator";

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
  const dirname = await esDirname();
  const migrationsPath = path.resolve(path.join(dirname, "migrations"));
  logger?.info(`reading migrations @ [${migrationsPath}]`);

  // Build the migration object
  const migrator = new SlonikMigrator({
    migrationsPath,
    migrationTableName: "migrations",
    slonik: pool,
  });

  // Perform migrations
  await migrator.up();

  return pool;
}
