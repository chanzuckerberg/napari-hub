SHELL := /bin/bash

### DOCKER ENVIRONMENTAL VARS #################################################
export DOCKER_BUILDKIT:=1
export COMPOSE_DOCKER_CLI_BUILD:=1
export COMPOSE_OPTS:=--env .env.ecr
export AWS_DEV_PROFILE=sci-imaging
export BACKEND_APP_ROOT=/var/task

### HELPFUL #################################################
help: ## display help for this makefile
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}'
.PHONY: help

.PHONY: rm-pycache
rm-pycache: ## remove all __pycache__ files (run if encountering issues with pycharm debugger (containers exiting prematurely))
	find . -name '__pycache__' | xargs rm -rf

### DOCKER LOCAL DEV #########################################
.env.ecr:
	export AWS_ACCOUNT_ID=$$(aws sts get-caller-identity --profile $(AWS_DEV_PROFILE) | jq -r .Account); \
	if [ -n "$${AWS_ACCOUNT_ID}" ]; then \
		echo DOCKER_REPO=$${AWS_ACCOUNT_ID}.dkr.ecr.us-west-2.amazonaws.com/ > .env.ecr; \
	else \
		false; \
	fi

.PHONY: local-ecr-login
local-ecr-login:
	if PROFILE=$$(aws configure list-profiles | grep $(AWS_DEV_PROFILE)); then \
		aws ecr get-login-password --region us-west-2 --profile $(AWS_DEV_PROFILE) | docker login --username AWS --password-stdin $$(aws sts get-caller-identity --profile $(AWS_DEV_PROFILE) | jq -r .Account).dkr.ecr.us-west-2.amazonaws.com; \
	fi

.PHONY: local-init
local-init: .env.ecr local-ecr-login ## Launch a new local dev env and populate it with test data.
	docker-compose $(COMPOSE_OPTS) up -d
	docker-compose $(COMPOSE_OPTS) run --rm --entrypoint /bin/bash backend -c "pip3 install awscli && $(BACKEND_APP_ROOT)/setup_dev_data.sh"

.PHONY: backend-debugger
backend-debugger: ## Attach to the backend service (useful for pdb)
	docker attach $$(docker-compose ps | grep backend | cut -d ' ' -f 1 | head -n 1)

.PHONY: local-status
local-status: ## Show the status of the containers in the dev environment.
	docker ps -a | grep --color=no -e 'CONTAINER\|napari-hub'

.PHONY: local-rebuild
local-rebuild: .env.ecr local-ecr-login ## Rebuild local dev without re-importing data
	docker-compose $(COMPOSE_OPTS) build frontend backend
	docker-compose $(COMPOSE_OPTS) up -d

.PHONY: local-sync
local-sync: local-rebuild local-init ## Re-sync the local-environment state after modifying library deps or docker configs

.PHONY: local-start
local-start: .env.ecr ## Start a local dev environment that's been stopped.
	docker-compose $(COMPOSE_OPTS) up -d

.PHONY: local-stop
local-stop: ## Stop the local dev environment.
	docker-compose stop

.PHONY: local-clean
local-clean: ## Remove everything related to the local dev environment (including db data!)
	docker-compose rm -sf
	-docker volume rm napari-hub_localstack

.PHONY: local-logs
local-logs: ## Tail the logs of the dev env containers. ex: make local-logs CONTAINER=backend
	docker-compose logs -f $(CONTAINER)

.PHONY: local-shell
local-shell: ## Open a command shell in one of the dev containers. ex: make local-shell CONTAINER=frontend
	docker-compose exec $(CONTAINER) bash
