# pandemic

> Pandemic map of Global Risk

Pandemic modelling and visualization for the [Australian Insitute of Tropical Health & Medicine](https://www.aithm.jcu.edu.au/),  for the [Tropical Partners project](https://www.aithm.jcu.edu.au/research/tropical-partners/themes/theme-2/)

## Install

This is a Javascript Single-Page-Application, which is compiled to a static web-page that can be opened anywhere, even on your local file-system.

Download, and decompress:

  &nbsp; &nbsp; <https://github.com/boscoh/pandemic/archive/master.zip>
 
The app needs to be compiled in the [`node.js`](https://nodejs.org/en/) ecosystem, using the default [ `npm` ](https://www.npmjs.com/) package-manager.

In the `pandemic` directory, run:

```bash
> npm install
```

Then build the client:

```bash
> npm run build
```

The app can now be opened from `pandemic/dist/index.html` in your browser.

## Development

If you are ready to make changes to the source code in the `pandemic/src` directory, you can run a development version of the app:

```bash
> npm run dev
```

This will open up the page in the browser at the url `localhost:8080`. Any changes in the `src` directory will cause the app to be recompiled and automatically reloaded in the browser.

This command is conveniently stored in `hot_reload.sh` for Mac and Linux.

If there is a conflict with port 8000, then in `package.json`, look for the lines with `webpack-dev-server`, and replace with the following line:

```
"dev": "webpack-dev-server --inline --progress --config build/webpack.dev.conf.js --port 3000",
```

Then open in the browser with: `http://localhost:3000`.

#### Framework

The app is written in the Vue framework using the [PlasticGui](https://github.com/boscoh/plasticgui) template.

#### Program flow

1. The entry point is the `index.html` file.
2. `index.html` will open `src/main.js`
3. `src/main.js` will set up Vue and load the Vue app.
4. Vue looks for the home page in `src/components/Home.vue`.
5. The models are loaded from there, where the global model is in `src/modules/global-model.js`, which will attempt to load different epi-models.
6. The individual epi-models are in `src/modules/models.js`
7. The data for travel is in `src/data/travel.js`, which is stored in a javascript data module format.
8. The data for country borders and coordinates are stored in `src/data.world.js`.


