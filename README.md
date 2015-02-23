akv-cache
=========

Asynchronous in-memory key-value cache.


### Installation

`npm install akv-cache`


### Usage

```js
var cache = require('akv-cache')({
    /* Global time-to-live */
    ttl: 10,

    /* Retrieval of fresh data */
    miss: function(key, callback) {

        /* callback(err, value, [ttl]) */
        callback(null, 'Some value');
    }
});
```


#### get(key, callback)

```js
cache.get('some-key', function(err, value) {
    if (err) return console.error(err);

    console.log('Got value: ' + value);
});
```


#### set(key, value, [ttl])

```js
cache.set('some-key', 'some-value');
cache.set('other-key', 'other-value', 15);
```


#### has(key)

```js
var keyExists = cache.has('some-key');
```


#### size()

```js
var cacheSize = cache.size();
```
