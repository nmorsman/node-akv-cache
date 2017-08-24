akv-cache
=========

Asynchronous in-memory key-value cache.



Installation
------------

`npm install akv-cache`



Usage
-----

```js
var cache = require('akv-cache')({
    /*
     * Global time-to-live
     * Default: 0
     */
    ttl: 10,

    /*
     * Cache grace period
     * Default: 0
     */
    grace: 60,

    /*
     * Default value when cache is empty
     * Default: undefined
     */
    emptyValue: undefined,

    /*
     * Function for retrieval of fresh data
     * Default: function(key, callback) { callback(null); }
     */
    miss: function(key, callback) {
        setTimeout(function() {
            /* callback(err, value, [ttl]) */
            callback(null, 'Data is here!');
        }, 1000);
    }
});
```


#### get(key, [callback]): mixed

```js
/*
 * Using a callback will guarantee a value, as it will wait for it to be generated.
 */

cache.get('some-key', function(err, value) {
    if (err) return console.error(err);

    console.log('Got value: ' + value);
});


/*
 * Using the return value will result in `undefined` if the cache
 * is empty or during data generation without a grace period.
 */

var value = cache.get('some-key');
```


#### set(key, value, [ttl]): akv-cache

```js
cache.set('key1', 'some value');

cache
    .set('key2', 'other value')
    .set('key3', 'third value', 15);
```


#### has(key): boolean

```js
var keyExists = cache.has('some-key');
```


#### size(): integer

```js
var cacheSize = cache.size();
```



License
-------

[MIT](LICENSE)
