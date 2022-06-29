.PHONY: all \
# Utilities
				ensure-tool-pnpm ensure-tool-node \
# Tests
				setup \
				bench \
				tests test-setup test-run test-extract-results \
# Local development/Debug
				debug-api-server \
# Local development DB
				db-local db-local-setup db-local-stop db-local \
				db-migration db-local-migrate db-local-revert \
				db-local-psql

KUBECTL ?= kubectl
NODE ?= node
PNPM ?= pnpm
DOCKER ?= docker

ROOT_DIR := $(dir $(abspath $(lastword $(MAKEFILE_LIST))))


DB_DATA_DIR ?= $(ROOT_DIR)output/postgres/data
DB_INIT_SCRIPTS_DIR ?= $(ROOT_DIR)output/postgres/init-scripts
DB_MIGRATIONS_DIR ?= $(ROOT_DIR)output/postgres/init-scripts

DB_CONTAINER_NAME ?= "supaseenby-pg"
DB_IMAGE ?= "postgres"
DB_IMAGE_TAG ?= "14.4-alpine"
DB_USER_NAME ?= "supaseenby"
DB_USER_PASSWORD ?= "supaseenby"
DB_NAME ?= "supaseenby"
DB_PORT ?= 5432
DB_HOST ?= localhost
DB_URL ?= "postgres://$(DB_USER_NAME):$(DB_USER_PASSWORD)@$(DB_HOST):$(DB_PORT)/$(DB_NAME)"

all: setup tests

###########
# Tooling #
###########

ensure-tool-pnpm:
ifeq ("","$(shell which $(PNPM))")
	$(error "PNPM is not installed (see: https://pnpm.io)")
endif

ensure-tool-node:
ifeq ("","$(shell which $(NODE))")
	$(error "NodeJS is not installed (see: https://github.com/nvm-sh/nvm, https://nodejs.org)")
endif

ensure-tool-docker:
ifeq ("","$(shell which $(DOCKER))")
	$(error "Docker is not installed (see: https://docs.docker.com)")
endif

#########
# Setup #
#########

setup: ensure-tool-pnpm
	$(PNPM) install

bench:
	echo -e "=> running benchmarks..."
	DB_URL=$(DB_URL) \
		$(PNPM) bench

#########
# Tests #
#########

tests: test-db-setup test-script-run text-extract-results

test-setup:
	echo -e "=> setting up for test..."
	$(error "NOT IMPLEMENTED")

test-run:
	echo -e "=> running test..."
	$(error "NOT IMPLEMENTED")

test-extract-results:
	echo -e "=> extracting results from test..."
	$(error "NOT IMPLEMENTED")

#####################
# Local development #
#####################

##########################
# Local development - DB #
##########################

db-local-setup:
	mkdir -p $(DB_DATA_DIR)

db-local-stop:
	@if docker ps | grep $(DB_CONTAINER_NAME) ; then \
		echo "[info] removing existing container if present..."; \
		$(DOCKER) kill $(DB_CONTAINER_NAME) || true; \
		$(DOCKER) rm $(DB_CONTAINER_NAME) || true; \
	fi

### Start a local DB for the API only
db-local: db-local-stop db-local-setup
	@echo -e "Running local DB...\n\n"
	$(DOCKER) run --rm \
		$(DOCKER_OPTS) \
		-it \
		--env POSTGRES_PASSWORD=$(DB_USER_PASSWORD) \
		--env POSTGRES_USER=$(DB_USER_NAME) \
		-p 127.0.0.1:${DB_PORT}:${DB_PORT} \
		-v ${DB_DATA_DIR}:/var/lib/postgresql/data:z \
		-v ${DB_INIT_SCRIPTS_DIR}:/docker-entrypoint-initdb.d:z \
		--name ${DB_CONTAINER_NAME} \
		${DB_IMAGE}:${DB_IMAGE_TAG}

db-local-clean:
	@echo -e "Cleaning local DB..."
	sudo rm -r ${DB_DATA_DIR}

db-migration:
ifeq (,$(NAME))
	$(error "NAME not set")
else
	DB_URL=$(DB_URL) \
	DB_MIGRATIONS_DIR=$(DB_MIGRATIONS_DIR) \
		$(PNPM) run "db:migration:create" --name $(NAME).sql
endif

db-local-migrate: ensure-tool-pnpm
	DB_URL=$(DB_URL) \
	DB_MIGRATIONS_DIR=$(DB_MIGRATIONS_DIR) \
		$(PNPM) run "db:migrate:up"

db-local-revert: ensure-tool-pnpm
	DB_URL=$(DB_URL) \
	DB_MIGRATIONS_DIR=$(DB_MIGRATIONS_DIR) \
		$(PNPM) run "db:migrate:down"

db-local-psql: ensure-tool-docker
	$(DOCKER) exec -it $(DB_CONTAINER_NAME) psql -U $(DB_USER_NAME)

###########################
# Local development - API #
###########################

api-local:
	echo -e "=> running server for local debug..."
	DB_URL=$(DB_URL) \
		$(PNPM) run "api:server"
