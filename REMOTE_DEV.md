# Happy Remote Development Environment

Remote development environments are currently available for employees at CZI. For local development
on your own machine, see instructions for setup at [./DEV_ENV.md].

Remote environments are also available through branches that named after prefix `dev-`

## Remote Dev Pre-requisites
1. Ensure your `awscli` is configured for `sci-imaging` profile.
1. Make sure you have the *latest version* of the AWS CLI installed. `brew upgrade awscli` if you're not sure:
   ```
   % aws --version
   aws-cli/2.1.8 Python/3.9.0 Darwin/19.6.0 source/x86_64 prompt/off
   ```
1. Run the following command to install prerequisites:
   ```
   pip install -r .happy/requirements.txt
   ```

### Overview
Each developer can run as many remote development *stacks* as they like. Each stack can represent a feature branch, experiment, or whatever's useful to you. Stacks are managed using the remote dev cli utility called `happy`.

The general remote dev workflow is:

1. Make some code changes
1. Run `happy create <your-stack-name>` to create a new stack
1. Visit the URL printed by the create step, share it with the team, etc.
1. Run `happy logs <your-stack-name> backend` to tail the logs of the napari hub api.
1. Make some more code changes
1. Run `happy update <your-stack-name>` to update the remote stack with your latest changes.
1. When you don't need your stack anymore, run `happy delete <your-stack-name>` to free up remote dev resources.

If you forget which stacks you've created, just run `happy list` at any time to list the current remote dev stacks.

### General CLI Usage
The CLI utility is evolving rapidly, so the best reference for which commands are available and how to use them is the CLI itself. All commands support a `--help` flag to print usage docs. For example:

```
% happy create --help
Create a new stack with a given tag.

Usage:
  happy create STACK_NAME [flags]

Flags:
      --aws-profile string                  Override the AWS profile to use. If speficied but empty, will use the default credentil chain.
      --config-path string                  Specify the path to your Happy project's config file
      --create-tag                          Will build, tag, and push images when set. Otherwise, assumes images already exist. (default true)
      --do-migrations                       Specify if you want to force migrations to run (default true)
      --docker-compose-config-path string   Specify the path to your Happy project's docker compose file
      --docker-compose-env-file string      Environment file to pass to docker compose
      --dry-run                             Plan all infrastructure changes, but do not apply them
      --env string                          Specify a Happy env
      --force                               Ignore the already-exists errors
  -h, --help                                help for create
      --project-root string                 Specify the root of your Happy project
      --skip-check-tag                      Skip checking that the specified tag exists (requires --tag)
      --skip-migrations                     Specify if you want to skip migrations
  -s, --slice string                        If you only need to test a slice of the app, specify it here
      --slice-default-tag string            For stacks using slices, override the default tag for any images that aren't being built & pushed by the slice
      --tag string                          Specify the tag for the docker images. If not specified we will generate a default tag.

Global Flags:
      --no-color   Use this to disable ANSI colors
  -v, --verbose    Use this to enable verbose mode
```

### GitHub Action Integration
A new stack can also be deployed to remote development environment through GitHub Action integration. Pushing any branch prefixed with "dev-" will trigger the GH Action workflow to create or update a dev stack, with the stack name equals the part of branch name following the prefix, e.g. pushing branch "dev-my-dev-branch" will deploy the stack "my-dev-branch" in the remote dev enviroment. This is useful in situation where local connections is slow.

### Authentication
The backend of Happy uses CZI's deployment of Terraform Enterprise (TFE) to deploy and track the resources
for the stacks. This requires logging into TFE to get a long-lived token tied to your user.
The first time you run the happy application, the prompt will give you a command to run to get a token;
follow its prompts.

The long-lived token's access to Terraform Enterprise will periodically expire. The happy CLI will let
you know when this happens, and give you instruction to access the TFE website in your
browser. Loading any TFE web page will reauthorize your token, and you can then re-run your command.

### Warnings

1. Stack name needs to be a valid DNS prefix: starts with a letter, only includes letters, numbers, and dashes, less than 64 characters in length.
1. Yes, you have access to manipulate your teammates' remote dev stacks. This is intentional, to enable collaboration on features. Please use responsibly.

