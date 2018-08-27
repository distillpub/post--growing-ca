# Distill post--example

Distill articles depend on [distillpub/template](https://github.com/distillpub/template) for styling and some functionality such as footnotes, citations, and math rendering. We built template as a standalone library of styles and [webcomponents](https://www.webcomponents.org/) to allow you to use any web development workflow you'd like. But what if you don't have strong opinions about that and just want a starter kit that works out of the box? This is such a starter kit.

This is using `webpack` for bundling, `svelte` & `svelte-loader` to build interactive components/diagrams, and `ejs` to inline SVGs—the same technology choices we used when building ambitious articles such as [Building Blocks of Interpretability](https://distill.pub/2018/building-blocks).

## Get started

Fork and rename, or simply copy this repository.

First time setup: `npm run install` to install dependencies.

Your article text is in `src/index.ejs`.

Writing: `npm run dev` to run a development server that autoreloads when you make changes. Visit [localhost:8080/index.html](localhost:8080/index.html) for a hot-reloading preview of the article.

Components are in `src`. The `.html` files are [svelte](https://svelte.technology/guide) components, the `.js` files are compilation endpoints that are also defined in `webpack.config.js`. These compiled endpoints are then consumed by hand authored `.ejs` files in `src`.


## Feedback

Please [join our Distill Slack workspace](https://join.slack.com/t/distillpub/shared_invite/enQtMzg1NzU3MzEzMTg3LWJkNmQ4Y2JlNjJkNDlhYTU2ZmQxMGFkM2NiMTI2NGVjNzJkOTdjNTFiOGZmNDBjNTEzZGUwM2U0Mzg4NDAyN2E) if you have any questions. [Open an issue](https://github.com/distillpub/post--example/issues) if you'd like to see something improved!
