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
`key`         | *string*    | `id`         | The name of the unique primary key to use for get, set and remove operations. Optional, if not provided, auto-generated ids will be used.
`index`       | *string*    |              | One or multiple indices which can be used to order and  the results of queries which return multiple items.

## Methods

Method        | Parameters   | Returns                                         | Description
---           | ---          | ---                                             | ---
`save()`      | object       | Promise for the key of the saved object         | Save an object.
`set()`       | key, object  | Promise for the key of the saved/updated object | Store/upate an object to at a key.
`get()`       | key          | Promise for the object                          | Retrieves the object at the key.
`remove()`    | key          | Promise for null                                | Deletes the object at the key.
`getAll()`    |              | Promise for all items                           | Retrieves all stored object.
`getMany()`   | options      | Promise for multiple items                      | Returns multiple stored objects.
              | * start      |                                                 |
              | * end        |                                                 |
              | * count      |                                                 |
              | * offset     |                                                 |
              | * orderby    |                                                 |
              | * reverse    |                                                 |
`size()`      |              | Promise for the number of stored items          | Returns the number of stored objects.
`clear()`     |              | Promise for nothing.                            | Deletes all database entries.

## Development

In order to run it locally you'll need to fetch some dependencies and a basic server setup.

* Install [Bower](http://bower.io/) & [Gulp](http://gulpjs.com/):

    ```sh
    $ npm install -g bower gulp
    ```

* Install local dependencies:

    ```sh
    $ bower install && npm install
    ```

* To test the project, start the development server and open `http://localhost:3001`.

    ```sh
    $ gulp server
    ```

* To build the css and lint the scripts.

    ```sh
    $ gulp build
    ```

* To provide a live demo, send everything to `gh-pages` branch.

    ```sh
    $ gulp deploy
    ```

## License

[MIT License](http://opensource.org/licenses/MIT)
