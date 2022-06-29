# supabase-seen-by

Experiments implementing Seen-By functionality with Postgres, done for Supabase

This repository contains the scripts and configuration required to set up and perform basic benchmarking on different implementations of "seen by" (recording when a user has seen a given post or notification) with [Postgres][pg]

## Results

## Prerequisites

If you want to run the code in this repository yourself, you'll need a few things set up:

- [GNU Make][gnu-make] for orchestration
- [NodeJS][node] installed, with [PNPM][pnpm]
  - To install dependencies and run local scripts
- A [Kubernetes][k8s] cluster with a reasonable dynamic `PersistentVolume` provisioner
  - To set up Postgres [`Deployment`][k8s-deployment]s and run benchmark [`Job`][k8s-job]s
  - You are expected to either have `kubectl` in your `PATH` or export that variable to env (`KUBECTL=/path/to/your/kubectl`)
  - You must specify the [StorageClass][k8s-storageclass] of the PVCs that will be created with the ENV variable `K8S_STORAGE_CLASS`
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
$ make test-local
```

This will run the tests script against your local database.

To run the test suite agaisnt a Kubernetes environment, run the usual `test` make target (this requires building images and making them available to the kubernetes cluster, etc).

[k8s]: https://kubernetes.io
[pg]: https://postgresql.org
[node]: https://nodejs.org
[pnpm]: https://pnpm.io
[k8s-deployment]: https://kubernetes.io/docs/concepts/workloads/controllers/deployment/
[k8s-job]: https://kubernetes.io/docs/concepts/workloads/controllers/job/
[gnu-make]: https://www.gnu.org/software/make
[k8s-storageclass]: https://kubernetes.io/docs/concepts/storage/storage-classes/
