# Contributing guide of Bunny Deploy

Thanks for your interest in contributing to Bunny Deploy! \
In this document you can find some instructions to get started.

## Quick start

See getting started for more info about each command.

```bash
nvm install
nvm use
npm install -g pnpm
pnpm install

# most important commands:
pnpm test
pnpm build
pnpm lint
pnpm format
```

## Getting started

nvm is used in this project to install and use the right node version. \
If you don't have nvm, see: <https://github.com/nvm-sh/nvm#installing-and-updating>

First we need to install the right node version:

```bash
nvm install
```

Then we need to make use of the installed version by running:

```bash
nvm use
# Or to set default node version (node version listed in .nvmrc file):
nvm alias default SPECIFY_NODE_VERSION_HERE
```

pnpm is used to manage the used packages in this project. \
If you don't have pnpm, see: <https://pnpm.io/installation#using-npm>

To install the required dependencies, run:

```bash
pnpm install
```

## Rules to follow before creating a new MR

### Add documentation

Add documentation when adding a new feature or introducing something new that could be complex to follow for other devs.

### Add tests

Tests should be added for new features or fixed bugs.

### Commits

Commit messages are written according to the Conventional Commits specification. \
A quick summary of the specification, can be found here: <https://www.conventionalcommits.org/en/v1.0.0/#summary>

### Adding a new dependency

In this project dependency versions are pinned on a specific version. \
Pinned versions can be added by using the --save-exact (-E) flag.

```bash
pnpm add --save-exact SOME_DEPENDENCY
pnpm install
```

#### Dev dependency

```bash
pnpm add --save-exact --save-dev SOME_DEPENDENCY
pnpm install
```

#### Minimum requirements for a new dependency

- Should be maintained on a regular basis
  - Prefer dependencies with 100+ stars or some other indication, which makes it likely that it will be maintained for the upcoming months/years.
- Has zero vulnerabilities in the latest version
- Has a license which allows it to be used in this project
