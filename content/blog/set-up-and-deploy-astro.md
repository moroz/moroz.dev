---
title: How to set up and deploy an Astro website to Github Pages
date: 2025-06-08
summary: This post describes the steps necessary to deploy an Astro project to Github Pages.
---

Make sure you have [mise](https://mise.jdx.dev/) installed:

```shell
$ mise version
2025.6.0 macos-arm64 (2025-06-02)
```

Using `mise`, install latest [Node.js](https://nodejs.org/en) (24.1.0 as of this writing), `pnpm` (10.11.1 as of this writing), and `prettier` (3.5.3 as of this writing):

```shell
mise use -g node@24.1.0 npm:pnpm@10.11.1 npm:prettier@3.5.3
```

In the directory where you keep your projects (e. g. `~/projects`), create an Astro project using `pnpm create`:

```shell
# Replace this with the name of your project
$ project_name=megane

# Create an Astro project called `$project_name` using the minimal template.
# Create a Git repository for the project and install dependencies.
$ pnpm create astro@latest $project_name --template minimal --git --install  

# Change the working directory to the project's directory
$ cd $project_name
```

Set versions for Node, pnpm and Prettier for the current project:

```shell
mise use node@24.1.10 npm:pnpm@10.11.1 npm:prettier@3.5.3
```

### Install and set up Prettier

Install Prettier and its plugins using `pnpm`. This will install plugin for [Svelte](https://svelte.dev/) and [Tailwind](https://tailwindcss.com/).

```shell
$ pnpm add -D prettier prettier-plugin-{astro,svelte,tailwindcss}
```

In the project's root directory, create a file called `.prettierrc.cjs`:

```javascript
module.exports = {
  plugins: [
    require.resolve("prettier-plugin-astro"),
    require.resolve("prettier-plugin-svelte"),
    require.resolve("prettier-plugin-tailwindcss"),
  ],
  overrides: [
    {
      files: "*.astro",
      options: {
        parser: "astro",
      },
    },
    {
      files: "*.svelte",
      options: {
        parser: "svelte",
      },
    },
  ],
};
```

With this set up, you should be able to format source code in the project using `prettier`:

```shell
$ prettier -w .
.vscode/extensions.json 16ms (unchanged)
.vscode/launch.json 1ms (unchanged)
astro.config.mjs 3ms
package.json 0ms
pnpm-lock.yaml 113ms
README.md 15ms
tsconfig.json 1ms (unchanged)
```
