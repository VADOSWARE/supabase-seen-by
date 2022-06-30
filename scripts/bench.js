import * as process from "process";
import * as path from "path";
import * as os from "os";
import { createReadStream } from "node:fs";
import * as readline from "node:readline";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import { pipeline } from "node:stream/promises";
import esDirname from "es-dirname";
import JSONStream from "JSONStream";

import { sql } from "slonik";
import getLogger from "pino";
import autocannon from "autocannon";
import { default as printResult } from "autocannon/lib/printResult.js";
import isURL from "validator/lib/isURL.js";
import esMain from "es-main";

import { generateUsers } from "./generate/users.js";
import { generatePosts } from "./generate/posts.js";
import { buildAPI } from "./api.js";

const DEFAULT_TEST_RECORD_SEEN_BY_COUNT = 1000;
const DEFAULT_TEST_GET_SEEN_BY_COUNT = 2000;
const DEFAULT_TEST_WORKER_COUNT = 2;
const DEFAULT_TEST_TARGET_BASE_URL = "http://localhost:5001";

const DEFAULT_TEST_SERVER_PORT = 5001;
const DEFAULT_TEST_DURATION_SECONDS = 30;

export default async function runBenchmark() {
  const logger = getLogger();

  // Ensure Target Base URL is a valid base url
  let targetBaseURL = process.env.TEST_TARGET_BASE_URL ?? DEFAULT_TEST_TARGET_BASE_URL;
  if (!targetBaseURL || !isURL(targetBaseURL, { require_tld: false })) {
    throw new Error(`Missing/invalid target base URL [${targetBaseURL}`);
  }
  const targetbaseURL = new URL(targetBaseURL);

  // Start the server
  const api = await buildAPI();
  logger.debug("starting API server...");
  api.listen({ port: new URL(targetBaseURL).port });

  // Temporary directory which is used to for generation
  const tmpdir = await mkdtemp(path.join(os.tmpdir(), "supabase-seen-by-"));

  // Clear out existing tables ahead of time
  await api.db.query(sql`TRUNCATE posts, users, posts_seen_by_users;`);

  ///////////////////////////
  // Generate & load users //
  ///////////////////////////

  // Generate users, if necessary
  // FUTURE: reduce to PG-only w/ generate_series
  let users;
  let usersJSONPath = process.env.TEST_USERS_JSON_PATH;
  if (!usersJSONPath) {
    usersJSONPath = path.join(tmpdir, "users.json");
    logger.info(`TEST_USERS_JSON_PATH not specified, generating user seed list @ [${usersJSONPath}]`);
    await generateUsers({
      count: process.env.TEST_USER_COUNT ? parseInt(process.env.TEST_USER_COUNT, 10) : undefined,
      outputFilePath: usersJSONPath,
    });
  }

  // Load all user JSON (Ideally we'd use COPY here but slonik's copyFromBinary doesn't seem to work...)
  // @ 100k users this takes ~5m 30s
  logger.info(`loading users from JSON file @ [${usersJSONPath}]`);
  const userJSONFileStream = createReadStream(usersJSONPath);
  const userJSONLines = readline.createInterface({
    input: userJSONFileStream,
    crlfDelay: Infinity
  });
  for await (const line of userJSONLines) {
    try {
      const user = JSON.parse(line);
      await api.db.query(
        sql`INSERT INTO users (id, email, name, about_html) VALUES (${user.id}, ${user.email}, ${user.name}, ${user.about_html})`,
      );
    } catch (err) {
      logger.error({ err, data: { line } }, "failed to parse line");
    }
  }

  ///////////////////////////
  // Generate & load posts //
  ///////////////////////////

  // Generate posts, if necessary
  // FUTURE: reduce to PG-only w/ generate_series
  let posts;
  let postsJSONPath = process.env.TEST_POSTS_JSON_PATH;
  if (!postsJSONPath) {
    postsJSONPath = path.join(tmpdir, "posts.json");
    await generatePosts({
      userCount: process.env.TEST_USER_COUNT ? parseInt(process.env.TEST_USER_COUNT, 10) : undefined,
      postCount: process.env.TEST_POST_COUNT ? parseInt(process.env.TEST_POST_COUNT, 10) : undefined,
      outputFilePath: postsJSONPath,
    });
  }

  // Load all post JSON (Ideally we'd use COPY here but slonik's copyFromBinary doesn't seem to work...)
  // @ 100k posts this takes ~5m 30s
  logger.info(`loading posts from JSON file @ [${postsJSONPath}]`);
  const postJSONFileStream = createReadStream(postsJSONPath);
  const postJSONLines = readline.createInterface({
    input: postJSONFileStream,
    crlfDelay: Infinity
  });
  for await (const line of postJSONLines) {
    try {
      const post = JSON.parse(line);
      await api.db.query(sql`
INSERT INTO posts
(id, title, content, main_image_src, main_link_src, created_by)
VALUES
(${post.id}, ${post.title}, ${post.content}, ${post.main_image_src}, ${post.main_link_src}, ${post.created_by})
`);
    } catch (err) {
      logger.error({ err, data: { line } }, "failed to parse line");
    }
  }

  //////////////
  // Run Test //
  //////////////

  // Parse test configuration
  const duration = parseInt(
    process.env.TEST_DURATION_SECONDS ?? `${DEFAULT_TEST_DURATION_SECONDS}`,
    10,
  );

  const currentDir = path.resolve(await esDirname());
  const setupRequestScriptPath = path.join(currentDir, "setup-request.cjs");
  logger.info(`Using setup request script @ [${setupRequestScriptPath}]`);

  let workers;
  if (process.env.TEST_WORKER_COUNT) {
    workers = parseInt(process.env.TEST_WORKER_COUNT ?? `${DEFAULT_TEST_WORKER_COUNT}`, 10);
  }

  // Execute the API calls with autocannon
  logger.info(`starting autocannon executions against [${targetBaseURL}]...`);
  const results = await autocannon({
    workers,
    url: targetBaseURL,
    bailout: 3,
    duration,
    connections: 1,
    requests: [
      {
        // If workers are being used, setup should be a path to require-able file,
        // not the function actually contained therein.
        // data sharing (ex. userCount) is done via ENV
        setupRequest: workers ? setupRequestScriptPath : (await import(setupRequestScriptPath)).default,
      },
    ],
  });

  // Write JSON results to tmpdir
  const resultsOutputPath = path.join(tmpdir, "results.json");
  await writeFile(resultsOutputPath, JSON.stringify(results, null, 2));
  logger.info(`JSON stats output @ [${resultsOutputPath}]`);

  // Pretty print the results
  const prettyPrintedResults = printResult(
    results,
    {
      outputStream: process.stdout,
      renderResultsTable: true,
      renderLatencyTable: true,
    },
  );
  console.log(prettyPrintedResults);

  // Stop the server
  logger.debug("stopping API server...");
  await api.close();
}

if (esMain(import.meta)) { runBenchmark(); }
