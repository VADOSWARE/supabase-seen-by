const process = require("process");

const POST_COUNT = process.env.TEST_POST_COUNT ? parseInt(process.env.TEST_POST_COUNT, 10) : undefined;
const USER_COUNT = process.env.TEST_USER_COUNT ? parseInt(process.env.TEST_USER_COUNT, 10) : undefined;

/**
 * Request setup function for use with autocannon
 *
 * @param {Request} request
 * @returns {Request}
 */
function setupRequest(request) {
  // ENsure we have counts to go off of
  if (!POST_COUNT || !USER_COUNT) {
    throw new Error("Cannot setup request without valid post/user count!");
  }

  // Pick a random post to do an operation on
  const postId = Math.floor(Math.random() * POST_COUNT);

  // Choose pseudo-randomly whether to register a seen by or read seenby status
  const doRegisterSeenBy = Math.floor(Math.random() * 10) < 7;
  if (doRegisterSeenBy) {
    // Pick a random user to view
    const userId = Math.floor(Math.random() * USER_COUNT);

    // Most of the time we'll be *setting* seen-by
    // And we'll get the count (so we can show it) later as well
    request.method = "POST";
    request.path = `/posts/${postId}/seen-by/${userId}`;
  } else {
    // A small amount of the time, we'll be getting the full list of people who have seen a post
    request.method = "GET";
    request.path = `/posts/${postId}/seen-by`;
  }

  return request;
}

module.exports = setupRequest;
