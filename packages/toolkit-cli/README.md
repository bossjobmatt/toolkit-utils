## toolkit-cli

This package provides the `toolkit` command and a helper `setup-npm-github` CLI which helps store a GitHub Packages token into macOS Keychain and configure `~/.npmrc` for an organization.

Usage (run from repo root):

```bash
node packages/toolkit-cli/bin/setup-npm-github.js --org yolotechnology
```

Or after linking/installing:

```bash
npm link
setup-npm-github --org yolotechnology
```

# Flags and behavior

- `--org ORG` (default `yolotechnology`) — set the GitHub org used in `~/.npmrc`.
- `--token TOKEN` — provide token via CLI (useful for automation; note: may be stored in shell history).
- `--dry-run` — show intended actions without writing Keychain or files. Use this to preview changes safely.

Before performing writes (when not in `--dry-run`), the CLI asks for interactive confirmation `y/N`.

Security note: Prefer providing tokens via secure environment variables or CI secret mechanisms. Avoid placing real tokens into shell history.
# toolkit-cli

- 1.create `.npmrc` file

```bash
@bossjobmatt:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=YOUR_GITHUB_ACCESS_TOKEN
```

- 2.install toolkit-cli

```bash
npm install @bossjobmatt/toolkit-cli@1.0.0
```