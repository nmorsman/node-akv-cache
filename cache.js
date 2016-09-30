function Cache(opts) {
    this.cache = {};
    this.lastGcTime = (new Date()).getTime();

    this.opts = {
        ttl: (opts && (typeof opts.ttl !== 'undefined')) ? opts.ttl : 0,
        grace: (opts && (typeof opts.grace !== 'undefined')) ? opts.grace : 0,
        miss: (opts && (typeof opts.miss === 'function')) ? opts.miss : function(key, callback) { callback(null); },
        gcInterval: (opts && (typeof opts.gcInterval !== 'undefined')) ? opts.gcInterval : 60
    };
}


/*
 * Internal garbage collector
 */

Cache.prototype.__gc = function() {
    var self = this;
    var now = (new Date()).getTime();
    var nextGc = (self.lastGcTime + (self.opts.gcInterval * 1000));

    /* Interval */
    if (now < nextGc) {
        return;
    }

    Object.keys(self.cache).forEach(function(key) {
        /* A working object is not garbage */
        if (self.cache[key].working) {
            return;
        }

        /* An object within expiration/grace is not garbage */
        if ((self.cache[key].expires + (self.opts.grace * 1000)) > now) {
            return;
        }

        /* The rest is garbage */
        delete self.cache[key];
    });

    self.lastGcTime = now;
};


/*
 * Cache key existence
 */

Cache.prototype.has = function(key) {
    if (this.cache[key] && this.cache[key].defined) {
        var now = (new Date()).getTime();

        if ((this.cache[key].expires + (this.opts.grace * 1000)) > now) {
            return true;
        }
    }

    return false;
};


/*
 * Cache size
 */

Cache.prototype.size = function() {
    var self = this;
    var size = 0;

    Object.keys(self.cache).forEach(function(key) {
        if (self.has(key)) {
            size++;
        }
    });

    return size;
};


/*
 * Internal setter
 */

Cache.prototype.__set = function(err, key, value, ttl) {
    var self = this;

    /* Return errors if something went wrong */
    if (err) {
        if (self.cache[key]) {
            while (self.cache[key].callbacks.length) {
                self.cache[key].callbacks.pop()(err);
            }

            delete self.cache[key];
        }

        return;
    }

    /* Run through callbacks and return value */
    if (self.cache[key]) {
        while (self.cache[key].callbacks.length) {
            self.cache[key].callbacks.pop()(null, value);
        }
    }

    /* Update cache object */
    self.cache[key] = {
        value: value,
        defined: true,
        working: false,
        expires: ((new Date()).getTime() + (ttl * 1000)),
        callbacks: []
    };

    /* Collect garbage */
    self.__gc();
};


/*
 * Setter
 */

Cache.prototype.set = function(key, value, ttl) {
    if (typeof ttl === 'undefined') {
        ttl = this.opts.ttl;
    }

    this.__set(null, key, value, ttl);
    return this;
};


/*
 * Getter
 */

Cache.prototype.get = function(key, callback) {
    var self = this;
    var graceful = false;

    /* Cache hit */
    if (self.cache[key] && self.cache[key].defined) {
        if (this.cache[key].expires > (new Date()).getTime()) {
            if (typeof callback === 'function') {
                callback(null, self.cache[key].value);
            }

            return self.cache[key].value;
        }
    }

    /* Create cache object if missing */
    if (!self.cache[key]) {
        self.cache[key] = {
            value: undefined,
            defined: false,
            working: false,
            expires: null,
            callbacks: []
        };
    }

    /* Callback if object is graceful, if not append callback to queue */
    if (self.has(key)) {
        graceful = true;

        if (typeof callback === 'function') {
            callback(null, self.cache[key].value);
        }
    }
    else {
        if (typeof callback === 'function') {
            self.cache[key].callbacks.push(callback);
        }
    }

    /* Generate new cache value if no work is being done */
    if (!self.cache[key].working) {
        self.cache[key].working = true;

        self.opts.miss(key, function(err, value, ttl) {
            if (typeof ttl === 'undefined') {
                ttl = self.opts.ttl;
            }

            self.__set(err, key, value, ttl);
        });
    }

    /* Return */
    return graceful ? self.cache[key].value : undefined;
};


/*
 * Exports
 */

module.exports = function(opts) {
    return new Cache(opts);
};
