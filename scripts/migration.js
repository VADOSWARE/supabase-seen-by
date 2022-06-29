import * as process from "process";
import * as path from "path";
import getLogger from "pino";


import esMain from "es-main";
import esDirname from "es-dirname";

import { createPool } from "slonik";
import { SlonikMigrator } from "@slonik/migrator";

async function main() {
  const logger = getLogger();

  const dbURL = process.env.DB_URL;
  if (!dbURL) { throw new Error("DB_URL not specified"); }

  // build the postgres pool
  const pool = await createPool(dbURL);

  // Perform DB migrations
  const migrationsPath = process.env.DB_MIGRATIONS_PATH ?? path.resolve(path.join(await esDirname(), "migrations"));
  logger.info(`using migrations @ [${migrationsPath}]`);

  // Build the migration object
  const migrator = new SlonikMigrator({
    migrationsPath,
    migrationTableName: "migrations",
    slonik: pool,
  });

  // Run migrator as CLI
  migrator.runAsCLI();
}

if (esMain(import.meta)) { main(); }
