function Cache(opts) {
    this._ttl = (opts && (typeof opts.ttl !== 'undefined')) ? opts.ttl : 0;
    this._missFn = (opts && opts.miss) ? opts.miss : null;
    this._data = {};
}


Cache.prototype.get = function(key, callback) {
    var self = this;

    if (self._data[key] && !self._data[key].working)
        return callback(null, self._data[key].value);

    if (!self._missFn)
        return callback('Cache miss: ' + key);

    if (!self._data[key]) {
        self._data[key] = {
            value: null,
            working: false,
            timer: null,
            callbacks: []
        };
    }

    self._data[key].callbacks.push(callback);

    if (!self._data[key].working) {
        self._data[key].working = true;
        
        self._missFn(key, function(err, value, ttl) {
            if (typeof ttl === 'undefined')
                ttl = self._ttl;

            self.__set(err, key, value, ttl);
        });
    }
};

Cache.prototype.set = function(key, value, ttl) {
    if (typeof ttl === 'undefined')
        ttl = this._ttl;

    this.__set(null, key, value, ttl);
    return this;
};

Cache.prototype.has = function(key) {
    if (this._data[key] && !this._data[key].working)
        return true;
    return false;
};

Cache.prototype.size = function() {
    return Object.keys(this._data).length;
};

Cache.prototype.__set = function(err, key, value, ttl) {
    var self = this;

    if (err) {
        if (self._data[key]) {
            while (self._data[key].callbacks.length)
                self._data[key].callbacks.pop()(err);
            delete self._data[key];
        }
        return;
    }

    if (self._data[key]) {
        while (self._data[key].callbacks.length)
            self._data[key].callbacks.pop()(null, value);
    }

    self._data[key] = {
        value: value,
        working: false,
        timer: setTimeout(function() {
            delete self._data[key];
        }, (ttl * 1000)),
        callbacks: []
    };
};

module.exports = function(opts) {
    return new Cache(opts);
};
