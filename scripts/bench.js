import * as process from "process";
import * as path from "path";
import * as os from "os";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";

import { sql } from "slonik";
import getLogger from "pino";
import autocannon from "autocannon";
import { default as printResult } from "autocannon/lib/printResult.js";
import isURL from "validator/lib/isURL.js";
import esMain from "es-main";

import { generateUsers } from "./generate/users.js";
import { generatePosts } from "./generate/posts.js";
import { generateAPICalls } from "./generate/api-calls.js";
import { buildAPI } from "./api.js";

const DEFAULT_TEST_RECORD_SEEN_BY_COUNT = 1000;
const DEFAULT_TEST_GET_SEEN_BY_COUNT = 2000;
const DEFAULT_TEST_WORKER_COUNT = 2;
const DEFAULT_TEST_TARGET_BASE_URL = "http://localhost:5001";

const DEFAULT_TEST_SERVER_PORT = 5001;

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
  await api.db.query(sql`TRUNCATE posts, users;`);

  // Generate users, if necessary
  let users;
  let usersJSONPath = process.env.TEST_USERS_JSON_PATH;
  if (!usersJSONPath) {
    usersJSONPath = path.join(tmpdir, "users.json");
    await generateUsers({ outputFilePath: usersJSONPath });
  }
  logger.info(`Using users from JSON file @ [${usersJSONPath}]`);
  users = JSON.parse(await readFile(usersJSONPath));

  // Ideally we'd use COPY here but slonik's copyFromBinary doesn't seem to work...
  for (const u of users) {
    await api.db.query(sql`INSERT INTO users (id, email, name, about_html) VALUES (${u.id}, ${u.email}, ${u.name}, ${u.about_html})`);
  }

  // Generate posts, if necessary
  let posts;
  let postsJSONPath = process.env.TEST_POSTS_JSON_PATH;
  if (!postsJSONPath) {
    postsJSONPath = path.join(tmpdir, "posts.json");
    await generatePosts({
      userCount: users.length,
      outputFilePath: postsJSONPath,
    });
  }
  posts = JSON.parse(await readFile(postsJSONPath));
  logger.info(`Using posts from JSON file @ [${postsJSONPath}]`);

  // Quick and dirty!
  for (const p of posts) {
    await api.db.query(sql`
INSERT INTO posts
(id, title, content, main_image_src, main_link_src, created_by)
VALUES
(${p.id}, ${p.title}, ${p.content}, ${p.main_image_src}, ${p.main_link_src}, ${p.created_by})
`);
  }

  // Generate actions (API Calls) to run
  let apiCalls;
  const apiRecordSeenByCount = parseInt(
    process.env.TEST_RECORD_SEEN_BY_COUNT ?? `${DEFAULT_TEST_RECORD_SEEN_BY_COUNT}`,
    10,
  );
  const apiGetSeenByCount = parseInt(
    process.env.TEST_GET_SEEN_BY_COUNT ?? `${DEFAULT_TEST_GET_SEEN_BY_COUNT}`,
    10,
  );

  // Generate API calls, if necessary
  let apiCallsJSONPath = process.env.TEST_APICALLS_JSON_PATH;
  if (!apiCallsJSONPath) {
    apiCallsJSONPath = path.join(tmpdir, "apiCalls.json");
    await generateAPICalls({
      userCount: users.length,
      postCount: posts.length,
      apiRecordSeenByCount,
      apiGetSeenByCount,
      outputFilePath: apiCallsJSONPath,
    });
  }
  logger.info(`Using API calls from JSON file @ [${apiCallsJSONPath}]`);
  apiCalls = JSON.parse(await readFile(apiCallsJSONPath));

  // Execute the API calls with autocannon
  logger.info(`starting executions (${apiCalls.length} API calls) against [${targetBaseURL}]...`);
  const results = await autocannon({
    workers: parseInt(process.env.TEST_WORKER_COUNT ?? `${DEFAULT_TEST_WORKER_COUNT}`, 10),
    url: targetBaseURL,
    bailout: 3,
    duration: 30,
    // amount: apiCalls.length,
    requests: apiCalls.map(ac => ({
      method: ac.method,
      path: ac.path,
      // onResponse: (status, body, context, headers) => {
      //   logger.debug({ status }, "response!");
      // },
    })),
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
