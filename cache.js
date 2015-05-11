function Cache(opts) {
    this._ttl = (opts && (typeof opts.ttl !== 'undefined')) ? opts.ttl : 0;
    this._missFn = (opts && opts.miss) ? opts.miss : null;
    this._lastGc = (new Date()).getTime();
    this._gcInterval = 60;
    this._data = {};
}


Cache.prototype.get = function(key, callback) {
    var self = this;

    if (self.has(key))
        return callback(null, self._data[key].value);

    if (!self._missFn)
        return callback('Cache miss: ' + key);

    if (!self._data[key]) {
        self._data[key] = {
            value: null,
            working: false,
            expires: null,
            callbacks: []
        };
    }

    self._data[key].callbacks.push(callback);
    if (self._data[key].working) return;

    self._data[key].working = true;

    self._missFn(key, function(err, value, ttl) {
        if (typeof ttl === 'undefined')
            ttl = self._ttl;

        self.__set(err, key, value, ttl);
    });
};

Cache.prototype.set = function(key, value, ttl) {
    if (typeof ttl === 'undefined')
        ttl = this._ttl;

    this.__set(null, key, value, ttl);
    return this;
};

Cache.prototype.has = function(key) {
    if (!this._data[key] || this._data[key].working)
        return false;

    return (this._data[key].expires > (new Date()).getTime());
};

Cache.prototype.size = function() {
    var now = new Date();
    var size = 0;

    for (var i in this._data) {
        if (!this._data[i].working && (this._data[i].expires > now)) {
            size++;
        }
    }

    return size;
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
        expires: ((new Date()).getTime() + (ttl * 1000)),
        callbacks: []
    };

    self.__gc();
};

Cache.prototype.__gc = function() {
    var self = this;
    var now = (new Date()).getTime();
    var nextgc = (self._lastGc + (self._gcInterval * 1000));

    if (now < nextgc)
        return;

    Object.keys(self._data).forEach(function(key) {
        if (self._data[key].expires > now) return;
        delete self._data[key];
    });

    self._lastGc = now;
};

module.exports = function(opts) {
    return new Cache(opts);
};
