import { appendFile } from "node:fs/promises";
import fastLoremIpsum from "fast-lorem-ipsum";

const DEFAULT_POST_COUNT = 1000;
const DEFAULT_TITLE_CHARACTER_COUNT = 7;
const DEFAULT_CONTENT_CHARACTER_COUNT = 256;

/**
 * Generate a list of synthetic posts to be loaded into Postgres
 *
 * @param {object} args
 * @param {number} [args.userCount] number of users that implies contiguous user IDs (0 to userCount-1)
 * @param {number} [args.aboutHTMLWordCount] number of words to generate (lorem ipsum) for about_html (serves to add heft to tuples)
 * @param {string} [args.outputFilePath] output file path, if present this functoin returns void
 * @returns {any[][]} List of generated synthetic posts
 */
export async function generatePosts(args) {
  const userCount = args.userCount;
  if (!userCount) { throw new Error("user count is missing"); }

  const postCount = args.postCount ?? DEFAULT_POST_COUNT;

  const titleCharacterCount = args.titleCharacterCount || DEFAULT_TITLE_CHARACTER_COUNT;
  const contentCharacterCount = args.contentCharacterCount || DEFAULT_CONTENT_CHARACTER_COUNT;

  const outputFilePath = args.outputFilePath;
  if (!outputFilePath) { throw new Error("output file path must be specified"); }

  let creatorId;
  const first20 = userCount * 0.20;
  const last80 = userCount * 0.80;

  // Generate all the posts with randomized creators
  for (var id = 0; id < postCount; id++) {

    if (Math.random() * 100 < 80) {
      // 80% of the time, one of the first 20 people make the posts
      creatorId = Math.floor(Math.random() * first20);
    } else {
      // 20% of the time, one of the later posters post
      creatorId = (Math.random() * last80) + first20;
    }
    creatorId = Math.floor(creatorId);

    const post = {
      id,
      title: fastLoremIpsum(titleCharacterCount, 'c'),
      content: fastLoremIpsum(contentCharacterCount, 'w'),
      main_image_src: `http://example.com/${fastLoremIpsum(10, 'w')}.png`,
      main_link_src: `http://example.com/${fastLoremIpsum(4, 'w')}?ref=supabook`,
      created_by: creatorId,
    };

    await appendFile(outputFilePath, `${JSON.stringify(post)}\n`);
  }

  // Write the entries to disk (returning nothing)
  if (outputFilePath) {
  }
}
