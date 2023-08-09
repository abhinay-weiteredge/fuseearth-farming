# mapshaper used for converting shp file into geojson in search component

### Vendor npm Reference
https://www.npmjs.com/package/mapshaper

### Vendor npm Reference
https://github.com/mbloch/mapshaper

### How to use
- Make sure to remove mapshaper dependency from package.json

- Download javascript files from the above mentioned git repo, and create in our app /vendor/mapshaper, copy all js files including mproj.js and past into /vendor/mapshaper/js

### Why we install loader and adding webpack .config & .ts file instead of mapshaper npm ?

mapshaper is node.js project, its have javascript files and can't run in typescript, 
So solution is we should convert .js files into typescript, 
so here using loader all mapshaper .js files includes into our application

- Make sure install `awesome-typescript-loader source-map-loader` using npm
  Example: >npm install --save awesome-typescript-loader source-map-loader

- create `webpack.config.js` file under our project root folder, add below code

```
    module.exports = {
      entry: "./src/app/index.ts",
      output: {
          filename: "./dist/bundle.js",
      },

      // Enable sourcemaps for debugging webpack's output.
      devtool: "source-map",

      resolve: {
          // Add '.ts' and '.tsx' as resolvable extensions.
          extensions: ["", ".webpack.js", ".web.js", ".ts", ".tsx", ".js"]
      },

      module: {
          loaders: [
              // All files with a '.ts' or '.tsx' extension will be handled by 'awesome-typescript-loader'.
              { test: /\.tsx?$/, loader: "awesome-typescript-loader" }
          ],

          preLoaders: [
              // All output '.js' files will have any sourcemaps re-processed by 'source-map-loader'.
              { test: /\.js$/, loader: "source-map-loader" }
          ]
      },

      // Other options...
    };
```

- create `vendor/mapshaper/index.ts` file, add below lines

  ```
    const mapshaper = require('src/app/vendor/mapshaper/js/mapshaper.js');
    mapshaper.enableLogging();
    module.exports = mapshaper;

    const zip = require('src/app/vendor/mapshaper/js/zip.js');
    zip.enableLogging();
    module.exports = zip;

    const mproj = require('src/app/vendor/mapshaper/js/mproj.js');
    mproj.enableLogging();
    module.exports = mproj;
  ```

### Changes in our Application files

- Make sure changes in `tsconfig.json` file, add below lines

  ```
    ...
      "include": [
        "./src/**/*"
      ],  
      "files": [
        "src/app/vendor/mapshaper/index.ts"
      ],
      "declaration": true,
      "allowJs": true,
    ...
  ```

- register/include mapshaper js files in `index.html`, add below lines
  ```
    ...
      <script src="app/vendor/mapshaper/js/zip.js" type="text/javascript"></script>
      <script src="app/vendor/mapshaper/js/modules.js" type="text/javascript"></script>
      <script src="app/vendor/mapshaper/js/mapshaper.js" type="text/javascript"></script>
      <script src="app/vendor/mapshaper/js/mproj.js" type="text/javascript"></script>
      <script type="text/javascript">
        zip.workerScripts = {
          deflater: ['app/vendor/mapshaper/js/z-worker.js', 'app/vendor/mapshaper/js/pako.deflate.js', 'app/vendor/mapshaper/js/codecs.js'],
          inflater: ['app/vendor/mapshaper/js/z-worker.js', 'app/vendor/mapshaper/js/pako.inflate.js', 'app/vendor/mapshaper/js/codecs.js']
        };
      </script>
      <script>
        window.mapshaper = mapshaper;
        window.zip_file = zip;
      </script>
    ...

  ```
- Add this code into our application where do we want upalod shp files,
  ```
    const cmd = '-i input.shp -o +init=EPSG:4326 output.geojson';
    // mapshaper.applyCommands(cmd, { 'input.shp': reader.result }, function (err, output) {
    mapshaper.runCommands(cmd, { 'input.shp': reader.result }, function (err, output) {
      console.log('success ', output, err);
    });
  ```
### Changes in mapshper.js
- Line 22288 `else if (name == 'proj') {` getting projection data from input by split `*`
- changes of all `var mproj = require('mproj');` to `mproj`(from index.ts)

### Changes in mproj.js
- changes are inside `function mproj_read_lib_anycase(`, 
- removed `required('fs')` and added content data using `fetch(/assets/epsg/epsg)` 
    or 
    `contents = '<4326> +proj=longlat +datum=WGS84 +no_defs  <>';`
- renamed `dstdefn` to `dstdefn.crs` because dstdefn undifind so adding crs have prj & init...etc