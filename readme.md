# x-storage-indexeddb

[![Build Status](https://travis-ci.org/dotch/x-storage-indexeddb.png)](https://travis-ci.org/dotch/x-storage-indexeddb)

## Demo

[Check it live!](http://dotch.github.io/x-storage-indexeddb)

## Usage

1. Import Web Components polyfill:

    ```html
    <script src="bower_components/platform/platform.js"></script>
    ```

2. Import Custom Element:

    ```html
    <link rel="import" href="src/element.html">
    ```

3. Start using it:

    ```html
    <x-storage-indexeddb></x-storage-indexeddb>
    ```

## Options

Attribute     | Options     | Default      | Description
---           | ---         | ---          | ---
`name`        | *string*    | `storage`    | The database name.
`index`       | *string*    | `storage`    | The database name.

## Methods

Method        | Parameters   | Returns     | Description
---           | ---          | ---         | ---
`save()`      | None.        | Nothing.    | Save an object.
`set()`       | None.        | Nothing.    | A method.
`get()`       | None.        | Nothing.    | A method.
`remove()`    | None.        | Nothing.    | A method.
`getAll()`    | None.        | Nothing.    | A method.
`getMany()`   | None.        | Nothing.    | A method.
`size()`      | None.        | Nothing.    | A method.
`clear()`     | None.        | Nothing.    | A method.

## Events

Event         | Description
---           | ---
`onsomething` | Triggers when something happens.

## Development

In order to run it locally you'll need to fetch some dependencies and a basic server setup.

* Install [Bower](http://bower.io/) & [Gulp](http://gulpjs.com/):

    ```sh
    $ [sudo] npm install -g bower gulp
    ```

* Install local dependencies:

    ```sh
    $ bower install && npm install
    ```

* To test your project, start the development server and open `http://localhost:3001`.

    ```sh
    $ gulp server
    ```

* To build your css and lint your scripts.

    ```sh
    $ gulp build
    ```

* To provide a live demo, send everything to `gh-pages` branch.

    ```sh
    $ gulp deploy
    ```

## License

[MIT License](http://opensource.org/licenses/MIT)
