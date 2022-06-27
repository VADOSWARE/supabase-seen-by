import http from "k6/http";
import { sleep } from "k6";

const DEFAULT_K6_VIRTUAL_USERS = 20;
const DEFAULT_K6_DURATION = "30s";

export const options = {
  vus: process.env.K6_VIRTUAL_USERS ?? DEFAULT_K6_VIRTUAL_USERS,
  duration: process.env.K6_DURATION ?? DEFAULT_K6_DURATION,
};

export default function() {

}
