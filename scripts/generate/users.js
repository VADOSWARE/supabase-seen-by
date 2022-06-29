import { writeFile } from "node:fs/promises";
import fastLoremIpsum from "fast-lorem-ipsum";

const DEFAULT_USER_COUNT = 1000;
const DEFAULT_ABOUT_HTML_WORD_COUNT = 100;

/**
 * Generate a list of synthetic users to be loaded into Postgres
 *
 * @param {object} args
 * @param {number} [args.count] number of users to generate
 * @param {number} [args.aboutHTMLWordCount] number of words to generate (lorem ipsum) for about_html (serves to add heft to tuples)
 * @param {string} [args.outputFilePath] output file path, if present this functoin returns void
 * @returns {any[][]} List of generated synthetic users
 */
export async function generateUsers(args) {
  const count = args.count || DEFAULT_USER_COUNT;
  const aboutHTMLWordCount = args.aboutHTMLWordCount || DEFAULT_ABOUT_HTML_WORD_COUNT;
  const outputFilePath = args.outputFilePath;
  const users = [];

  for (var id = 0; id < count; id++) {
    users.push({
      id,
      email: `user${id}@example.com`,
      name: `user ${id}`,
      about_html: fastLoremIpsum(aboutHTMLWordCount, 'w'),
    });
  }

  // Write the entries to disk (returning nothing)
  if (args.outputFilePath) {
    await writeFile(outputFilePath, JSON.stringify(users), "utf8");
  }

  return users;
}
