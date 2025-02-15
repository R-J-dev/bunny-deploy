# Contributing guide of Bunny Deploy

Thanks for your interest in contributing to Bunny Deploy! \
In this document you can find some instructions to get started.

## Quick start

See getting started for more info about each command.

```bash
proto install -c local # https://moonrepo.dev/docs/proto/install
pnpm install

# most important commands:
pnpm test
pnpm build
pnpm lint
pnpm format
```

## Getting started

proto is used in this project to install and use the right node and pnpm version. \
If you don't have proto, see: [Proto install docs](https://moonrepo.dev/docs/proto/install).

First we need to install the right node and pnpm version:

```bash
proto install -c local
```

pnpm is used to manage the used packages in this project.
To install the required dependencies, run:

```bash
pnpm install
```

## Rules to follow before creating a new PR

### Add documentation

Add documentation when adding a new feature or introducing something new that could be complex to follow for other devs.

### Add tests

Tests should be added for new features or fixed bugs.

### Commits

Commit messages are written according to the [Angular Commit Message Conventions](https://github.com/angular/angular.js/blob/master/DEVELOPERS.md#-git-commit-guidelines).

The git history needs to be clean, that means having no commits with messages like fix formatting or linting.
When you need to fix a linting error for example that occurred in an earlier commit, use a fixup commit (in combination with a rebase) inside your branch.

For example:

1. You commit something with a linting error, hash: `1234`
2. You commit something else: hash: `5678`
3. You see that you made a mistake in the first commit, fix it with: `git commit --fixup 1234`.
4. A new fixup commit has been created, but it needs to be combined with commit '1234'. Run: `git rebase -i --autosquash HEAD~3` and close the editor.
5. When commit '1234' already exists on the remote origin, run: `git push --force-with-lease`.

Contact me when you need help with the above described instruction, I am happy to help out :smile:

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
- Has a license (MIT) which allows it to be used in this project
