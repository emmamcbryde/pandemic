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
> yarn run dev
```

This will open up the page in the browser at the url `localhost:8080`. Any changes in the `src` directory will cause the app to be recompiled and automatically reloaded in the browser.

This command is conveniently stored in `hot_reload.sh` for Mac and Linux.

If there is a conflict with port 8000, then in `package.json`, look for the lines with `webpack-dev-server`, and replace with the following line:

```
"dev": "webpack-dev-server --inline --progress --config build/webpack.dev.conf.js --port 3000",
```

Then open in the browser with: `localhost:3000`.

## Framework

The app is written in `vue` framework using the `plasticgui` template skeletion.

## Program flow

1. The entry point is the `index.html` file.
2. `index.html` will open `src/main.js`
3. `src/main.js` will set up Vue and load the Vue app.
4. Vue looks for the home page is in `src/components/Home.vue`.
5. The models are loaded from there, where the global model is in `src/modules/global-model.js`, which will attempt to load different epi-models.
6. The individual epi-models are in `src/modules/models.js`
7. The data for travel is in `src/data/travel.js`, which is stored in a javascript data module format.
8. The data for country borders and coordinates are stored in `src/data.world.js`.

