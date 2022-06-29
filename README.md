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

## Development

If you're interested in improving/modifying this project, here are a few tips to get you started

### Editing the code

The code can be edited however you'd like -- with whatever tools you'd like

### Working with a local DB

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
$ make bench
```

This will run the tests script against your local database.

[pg]: https://postgresql.org
[node]: https://nodejs.org
[pnpm]: https://pnpm.io
[gnu-make]: https://www.gnu.org/software/make
