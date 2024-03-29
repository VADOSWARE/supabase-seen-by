# supabase-seen-by

Experiments implementing Seen-By functionality with Postgres, done for Supabase

This repository contains the scripts and configuration required to set up and perform basic benchmarking on different implementations of "seen by" (recording when a user has seen a given post or notification) with [Postgres][pg]

## Results

## Prerequisites

If you want to run the code in this repository yourself, you'll need a few things set up:

- [GNU Make][gnu-make] for orchestration
- [NodeJS][node] installed, with [PNPM][pnpm]
  - To install dependencies and run local scripts
- [NodeJS][node]

## Running the tests

The tests can be run with the following:

```console
$ make
```

This will:

1. Install dependencies (`make setup`)
2. Run the tests (`make tests`)
   - Set up an individual test (`make test-setup`)
   - Run an individual test (`make test-run`)
   - Extract results from a test run to your local directory (`make test-extract-results`)

### Environment Variables

You can change the tests with the following environment variables

| ENV Var                     | Default          | Description                                                             |
|-----------------------------|------------------|-------------------------------------------------------------------------|
| `SEEN_BY_STRATEGY`          | `simple-counter` | The strategy to use for performing "seen-by" operations                 |
| `TEST_USER_COUNT`           | `1000`           | Number of users that will be created for the test                       |
| `TEST_POST_COUNT`           | `1000`           | Number of posts that will be created fo rhte test                       |
| `TEST_RECORD_SEEN_BY_COUNT` | `1000`           | How many times to *record* a "seen by" for posts (simulates a new view) |
| `TEST_GET_SEEN_BY_COUNT`    | `2000`           | How many times to *request* a "seen by" reading (simulates a page load) |

If you use [`direnv`][direnv], then your `.envrc` might look something like this:

```bash
export SEEN_BY_STRATEGY=simple-counter # or: simple-hstore, assoc-table, hll
export TEST_USERS_JSON_PATH=/tmp/supabase-seen-by.users.json
export TEST_POSTS_JSON_PATH=/tmp/supabase-seen-by.posts.json
export TEST_POST_COUNT=1000
export TEST_USER_COUNT=100000
export TEST_DURATION_SECONDS=60

## Use custom postgres image built with hll extension (https://github.com/citusdata/postgresql-hll)
## NOTE: `make db-custom-image` must be run beforehand
#export DB_IMAGE=postgres-14.4-alpine-hll
#export DB_IMAGE_TAG=latest
```

### Strategies

Since this repo is about testing ways to solve the "seen by" problem here are the simple strategies we implemented:

| Strategy            | Description                                                                          |
|---------------------|--------------------------------------------------------------------------------------|
| `simple-counter`    | Count on tuples in `posts` (without attribution)                                     |
| `simple-hstore`     | Use a `hstore` on every tuple in `posts`                                             |
| `assoc`             | Use an associative table, `SUM(*)`ing as necessary                                   |
| `assoc+hyperloglog` | Use a [HyperLogLog][wiki-hll] column for seen-by, with raw data in associative table |

## Development

If you're interested in improving/modifying this project, here are a few tips to get you started

### Editing the code

The code can be edited however you'd like -- with whatever tools you'd like

### Working with a local DB

First, we must build the local DB:

```console
$ make db-local-setup
```

This will build the

You can do various operations with the local DB, for example starting it:

```console
$ make db-local
```

Or creating a new migration

```console
$ make db-migration NAME=<migration name goes here with no spaces>
```

Or migrating/reverting

```console
$ make db-local-migrate
$ make db-local-revert
```

To access the local database with `psql`:

```console
$ make db-local-psql
```

### Running the API server locally

The API server that is used as part of the tests to simulate a real service can be run locally (assuming you have the local DB running):

```console
$ make api-local
```

### Running the benchmark

To run a test run, once you have the local DB running, run the `test-local` make target

```console
$ export SEEN_BY_STRATEGY=<the stategy you want>
$ make bench
```

This will run the tests script against your local database.

[pg]: https://postgresql.org
[node]: https://nodejs.org
[pnpm]: https://pnpm.io
[gnu-make]: https://www.gnu.org/software/make
[wiki-hll]: https://en.wikipedia.org/wiki/HyperLogLog
[direnv]: https://direnv.net
