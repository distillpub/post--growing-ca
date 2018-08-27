# Distill post--example

Distill articles usually depend on [distillpub/template](https://github.com/distillpub/template). Template is built to allow you to sue any web development workflow you'd like. But what id you don't have strong opinions on that and just want something that works out of the box? 

This is using `webpack` for bundling, `svelte` & `svelte-loader` to build interactive components/diagrams, and `ejs` to inline SVGs.

## Get started

Fork and rename, or simply copy this repository.

First time setup: `npm run install` to install dependencies.

Your article text is in `src/index.ejs`.

Writing: `npm run dev` to run a development server that autoreloads when you make changes. Visit [localhost:8080/index.html](localhost:8080/index.html) for a hot-reloading preview of the article.

Components are in `src`. The `.html` files are [svelte](https://svelte.technology/guide) components, the `.js` files are compilation endpoints that are also defined in `webpack.config.js`. These compiled endpoints are then consumed by hand authored `.ejs` files in `src`.


## Feedback

Please [join our Distill Slack workspace](https://join.slack.com/t/distillpub/shared_invite/enQtMzg1NzU3MzEzMTg3LWJkNmQ4Y2JlNjJkNDlhYTU2ZmQxMGFkM2NiMTI2NGVjNzJkOTdjNTFiOGZmNDBjNTEzZGUwM2U0Mzg4NDAyN2E) if you have any questions. [Open an issue](https://github.com/distillpub/post--example/issues) if you'd like to see something improved!
