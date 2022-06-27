# supabase-seen-by

Experiments implementing Seen-By functionality with Postgres, done for Supabase

This repository contains the scripts and configuration required to set up and perform basic benchmarking on different implementations of "seen by" (recording when a user has seen a given post or notification) with [Postgres][pg]

## Results

## Prerequisites

If you want to run the code in this repository yourself, you'll need a few things set up:

- [GNU Make][gnu-make] for orchestration
- [NodeJS][node] installed, with [PNPM][pnpm]
  - To install dependencies and run local scripts
- A [Kubernetes][kubernetes] cluster with a reasonable dynamic `PersistentVolume` provisioner
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

[k8s]: https://kubernetes.io
[pg]: https://postgresql.org
[node]: https://nodejs.org
[pnpm]: https://pnpm.io
[k8s-deployment]: https://kubernetes.io/docs/concepts/workloads/controllers/deployment/
[k8s-job]: https://kubernetes.io/docs/concepts/workloads/controllers/job/
[gnu-make]: https://www.gnu.org/software/make
