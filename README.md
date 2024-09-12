# Publish To Github Packages Demo

- [使用github package](https://docs.github.com/zh/packages/working-with-a-github-packages-registry/working-with-the-npm-registry)

## Install package

- 1.create `.npmrc` file

```bash
@bossjobmatt:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=YOUR_GITHUB_ACCESS_TOKEN
```

- 2.install toolkit-utils

```bash
npm install @bossjobmatt/toolkit-utils@1.0.4
```

- 3.install toolkit-cli

```bash
npm install @bossjobmatt/toolkit-cli@1.0.0
```