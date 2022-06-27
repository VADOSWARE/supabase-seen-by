.PHONY: all \
				ensure-tool-pnpm ensure-tool-node \
				setup \
				tests test-setup test-run test-extract-results \
				debug-api-server

KUBECTL ?= kubectl
NODE ?= node
PNPM ?= pnpm

all: setup tests

###########
# Tooling #
###########

ensure-tool-pnpm:
ifeq (,$(shell which $(PNPM))
	$(error "PNPM is not installed (https://pnpm.io)")
endif

ensure-tool-node:
ifeq (,$(shell which $(NODE))
	$(error "NodeJS is not installed (https://nodejs.org)")
endif

#########
# Setup #
#########

setup: ensure-tool-pnpm
	$(PNPM) install

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

#########
# Debug #
#########

debug-api-server:
	echo -e "=> running server for local debug..."
	$(NODE) ./scripts/api.js
