import { writeFile } from "node:fs/promises";
import fastLoremIpsum from "fast-lorem-ipsum";

const DEFAULT_TITLE_CHARACTER_COUNT = 7;
const DEFAULT_CONTENT_CHARACTER_COUNT = 256;

// https://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array
function shuffleInPlace(array) {
  let currentIndex = array.length,  randomIndex;

  // While there remain elements to shuffle.
  while (currentIndex != 0) {

    // Pick a remaining element.
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    // And swap it with the current element.
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex], array[currentIndex]];
  }

  return array;
}

/**
 * Generate a list of synthetic API calls to be performed
 *
 * @param {object} args
 * @param {number} [args.apiCallCount] number of users that implies contiguous user IDs (0 to userCount-1)
 * @param {string} [args.outputFilePath] output file path, if present this functoin returns void
 * @returns {object[]} List of generated synthetic posts
 */
export async function generateAPICalls(args) {
  const userCount = args.userCount;
  if (!userCount) { throw new Error("user count is missing"); }

  const postCount = args.postCount;
  if (!postCount) { throw new Error("post count is missing"); }

  const apiRecordSeenByCount = args.apiRecordSeenByCount;
  if (!apiRecordSeenByCount) { throw new Error("apiCall record seen by count is missing"); }

  // Ensure we cannot try more records than are possible
  if (apiRecordSeenByCount > userCount * postCount) {
    throw new Error("Reached the size where every single user has tried every single count!");
  }

  const apiGetSeenByCount = args.apiGetSeenByCount;
  if (!apiGetSeenByCount) { throw new Error("apiCall get seen by count is missing"); }

  const outputFilePath = args.outputFilePath;

  const apiCalls = [];

  // We will only ever record something as seen userCount times.
  // We *will* check for every API call.
  const usersRecordedSeen = new Map(); // userId -> postId

  // Generate seen-by recording (POST)
  let userId = Math.floor(Math.random() * userCount);
  let postId = Math.floor(Math.random() * postCount);
  for (var id = 0; id < apiRecordSeenByCount; id++) {

    // Simplest way is to pick random combinations for users and posts, until we get a new pair
    while (usersRecordedSeen.get(userId) === postId) {
      userId = Math.floor(Math.random() * userCount);
      postId = Math.floor(Math.random() * postCount);
    }

    apiCalls.push({
      action: "record-seen-by",
      method: "POST",
      path: `/posts/${postId}/seen-by/${userId}`
    });

    usersRecordedSeen.set(userId, postId);
  }

  // Generate retrievals (GET) of seen by status, these can be more or less random
  for (var i = 0; i < apiGetSeenByCount; i++) {
    postId = Math.floor(Math.random() * postCount);
    apiCalls.push({
      action: "retrieve-seen-by",
      method: "GET",
      path: `/posts/${postId}/seen-by`
    });
  }

  // Shuffle the array
  shuffleInPlace(apiCalls);

  // Write the entries to disk (returning nothing)
  if (outputFilePath) {
    await writeFile(outputFilePath, JSON.stringify(apiCalls), "utf8");
  }

  return apiCalls;
}
