import * as process from "process";
import * as path from "path";

import esDirname from "es-dirname";

// Enum of strategies to use
export const SEEN_BY_STRATEGY_NAME = {
  SimpleCounter: "simple-counter",
  SimpleHStore: "simple-hstore",
  AssocTable: "assoc-table",
  HLL: "hll",
};

const DEFAULT_SEEN_BY_STRATEGY = SEEN_BY_STRATEGY_NAME.SimpleCounter;

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
    this.getSeenByForPost = args.getSeenByForPost;
    this.recordSeenByForPost = args.recordSeenByForPost;
  }
}

/**
 * Set up pluggable seenBy Strategy information
 *
 * @returns SeenByStrategy
 */
export async function setupSeenByStrategy(args) {
  const logger = args.logger;

  // Retrieve strategy
  const strategy = args.strategy || DEFAULT_SEEN_BY_STRATEGY;
  if (!strategy) { throw new TypeError(`Missing/invalid strategy [${args.strategy}]`); }

  // Ensure strategy is valid
  if (!Object.values(SEEN_BY_STRATEGY_NAME).includes(strategy)) {
    throw new Error(`Invalid/unrecognized seen by strategy [${strategy}] (valid values are ${Object.values(SEEN_BY_STRATEGY_NAME).map(v => "'" + v + "'").join(",")})`);
  }

  // Use hardcoded path to strategy JS (strategy file must be named properly)
  const dirname = await esDirname();
  const defaultPath = path.join(dirname, "strategies");
  const strategyJSPath = path.resolve(
    args.strategyJSDir ?? process.env.SEEN_BY_STRATEGY_JS_DIR ?? defaultPath,
    `${strategy}.js`,
  );
  logger?.info(`loading strategy JS files from directory [${strategyJSPath}]...`);

  // Attempt to load the JS for a given strategy
  try {
    const seenByStrategyImport = await import(strategyJSPath);

    if (!seenByStrategyImport.build || typeof seenByStrategyImport.build !== "function") {
      throw new Error(`strategy JS file @ [${strategyJSPath}] is invalid -- it must export an async function called "build"`);
    }

    return new SeenByStrategy(await seenByStrategyImport.build());
  } catch (err) {
    logger?.error({ err }, "failed to import seen by strategy JS");
    throw new Error(`Failed to import seen by strategy from file @ [${strategyPath}]`);
  }
}
