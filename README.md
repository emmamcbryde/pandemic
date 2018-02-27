# pandemic

> Pandemic map of Global Risk

Pandemic visualization for the [Australian Insitute of Tropical Health & Medicine](https://www.aithm.jcu.edu.au/),  for the [Tropical Partners project](https://www.aithm.jcu.edu.au/research/tropical-partners/themes/theme-2/)

## Install

This is a Javascript SPA, which is compiled to a static web-page that can be opened anywhere, including from your local file-system.

The app needs to be compiled in the [`node.js`](https://nodejs.org/en/) ecosystem, using either the default [ `npm` ](https://www.npmjs.com/) package-manager, or the better [ `yarn` ](https://yarnpkg.com/) package manager.

Once `yarn` is installed, in the app directory, run:

```bash
> yarn install
```

Then build the client:

```bash
> yarn build
```

The app can now be opened from `dist/index.html` in your browser.

## Development

If you are ready to make changes to the source code in the `src` directory, you can run a development version of the app:

```bash
> ./hot_reload.sh
```

This will open up the page in the browser at the url `localhost:8080`. Any changes in the `src` directory will cause the app to be recompiled and automatically reloaded in the browser.

## Framework

The app is written in `vue` framework using the `basegui` template skeletion.

