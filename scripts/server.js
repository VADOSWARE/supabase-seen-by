import * as process from "process";

import esMain from "es-main";

import { buildAPI } from "./api.js";

const DEFAULT_PORT = 5000;

export async function runServer(args) {
  let api;
  try {
    api = await buildAPI();

    await api.listen({
      port: args?.port ?? parseInt(process.env.PORT ?? `${DEFAULT_PORT}`, 10),
    });

  } catch (err) {
    api ? api?.log.error(err) : console.log("ERROR", err);
    process.exit(1);
  }
};

// Run the apilication
if (esMain(import.meta)) { runServer(); }
