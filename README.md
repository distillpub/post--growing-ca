# Distill post--example
An example project with opinionated tool choices. Allows you to clone a repo and get straight into writing a Distill submission using the same tools we chose for ambitious articles like Building Blocks. 

This is using `webpack` for bundling, `svelte-loader` to build interactive components/diagrams, and `ejs` to inline SVGs.

## Get started

Fork and rename, or simply copy this repository.

First time setup: `npm run install` to install dependencies.

Your article text is in `src/index.ejs`.

Writing: `npm run dev` to run a development server that autoreloads when you make changes. Visit [localhost:8080/index.html](localhost:8080/index.html) for a hot-reloading preview of the article.

Components are in `src`. The `.html` files are [svelte](https://svelte.technology/guide) components, the `.js` files are compilation endpoints that are also defined in `webpack.config.js`. These compiled endpoints are then consumed by hand authored `.ejs` files in `src`.
